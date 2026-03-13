import { Score, TakeHome, TakeHomeAnalysis } from "./types";
import { takeHomeToXML } from "./utils";

const examples: {
  takeHome: TakeHome;
  analysis: TakeHomeAnalysis;
}[] = [
  {
    takeHome: {
      code: [
        {
          path: "expenses-bot-main/bot-service/config.py",
          content:
            'import os\nfrom dotenv import load_dotenv\n\nload_dotenv()\n\ndef get(key):\n    value = os.getenv(key)\n    if value is None:\n        raise ValueError(f"Environment variable {key} is not set")\n    return value',
        },
        {
          path: "expenses-bot-main/bot-service/create-and-seed-tables.py",
          content:
            'import asyncio\nimport config\nfrom sqlalchemy.ext.asyncio import create_async_engine, AsyncSession\nfrom sqlalchemy.orm import sessionmaker\n\nfrom database.models import Base, UserModel as User\n\nengine = create_async_engine(config.get(\'DATABASE_URL\'), echo=True, future=True)\nAsyncSessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)\n\nasync def reset_tables():\n    async with engine.begin() as conn:\n        await conn.run_sync(Base.metadata.drop_all)\n        await conn.run_sync(Base.metadata.create_all)\n\nasync def seed_data():\n    async with AsyncSessionLocal() as db:\n        with open("users.txt", "r") as f:\n            for line in f:\n                telegram_id = line.strip()\n                if telegram_id:\n                    user = await User.create(db, telegram_id=telegram_id)\n                    print(f"Created user: {user.telegram_id}")\n\nasync def main():\n    await reset_tables()\n    await seed_data()\n\nif __name__ == "__main__":\n    asyncio.run(main())\n',
        },
        {
          path: "expenses-bot-main/bot-service/database/__init__.py",
          content:
            "from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession\nfrom sqlalchemy.orm import sessionmaker\n\ndef get_db(url):\n    async def _get_db()-> AsyncSession:\n        async_engine = create_async_engine(url, echo=True, future=True)\n\n        AsyncSessionLocal = sessionmaker(\n            bind=async_engine,\n            expire_on_commit=False,\n            class_=AsyncSession,\n        )\n        async with AsyncSessionLocal() as session:\n            yield session\n    return _get_db",
        },
        {
          path: "expenses-bot-main/bot-service/database/models.py",
          content:
            'from sqlalchemy import Column, Integer, Text, TIMESTAMP, ForeignKey, select\nfrom sqlalchemy.sql import text\nfrom sqlalchemy.orm import relationship, declarative_base\nfrom sqlalchemy.dialects.postgresql import MONEY\nfrom sqlalchemy.ext.asyncio import AsyncSession\n\nBase = declarative_base()\n\nclass UserModel(Base):\n    __tablename__ = "users"\n    \n    id = Column(Integer, primary_key=True)\n    telegram_id = Column(Text, unique=True, nullable=False)\n\n    @classmethod\n    async def create(cls, db: AsyncSession, telegram_id: str) -> "UserModel":\n        user = cls(telegram_id=str(telegram_id))\n        db.add(user)\n        await db.commit()\n        await db.refresh(user)\n        return user\n\n    @classmethod\n    async def get_by_telegram_id(cls, db: AsyncSession, telegram_id: str) -> "UserModel | None":\n        result = await db.execute(select(cls).where(cls.telegram_id == str(telegram_id)))\n        user = result.scalars().first()\n        return user\n\n    async def add_expense(self, db: AsyncSession, data: dict):\n        data[\'amount\'] = f"{data[\'amount\']:.2f}"\n        expense = ExpenseModel(user_id=self.id, **data)\n        db.add(expense)\n        await db.commit()\n        await db.refresh(expense)\n        return expense\n\nclass ExpenseModel(Base):\n    __tablename__ = "expenses"\n    \n    id = Column(Integer, primary_key=True)\n    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)\n    description = Column(Text, nullable=False)\n    amount = Column(MONEY, nullable=False)\n    category = Column(Text, nullable=False)\n    added_at = Column(TIMESTAMP(timezone=True), server_default=text(\'now()\'))',
        },
        {
          path: "expenses-bot-main/bot-service/helpers.py",
          content:
            "import re\n\ndef contains_numbers_and_words(text: str) -> bool:\n    return bool(re.search(r'\\d+', text)) and bool(re.search(r'[a-zA-Z]', text))",
        },
        {
          path: "expenses-bot-main/bot-service/ia.py",
          content:
            'from typing import Optional\nfrom pydantic import BaseModel\nfrom langchain_openai import ChatOpenAI\nfrom schema import Expense\nimport config\n\nllm = ChatOpenAI(\n    model="gpt-4o-mini",\n    temperature=0,\n    api_key=config.get("OPENAI_API_KEY"),\n)\n\ndef extract_expense(message: str) -> Optional[Expense]:\n    structured_llm = llm.bind_tools(\n        [Expense],\n        strict=True,\n        tool_choice="Expense"\n    )\n\n    messages = [\n        (\n            "system",\n            "You are expense recording assistant. If you detect an expense (description and cost), extract it using the provided tool. Otherwise return null.\\n\\n"\n            "The expense fields are:\\n"\n            "- description: a brief text describing the expense (e.g., \'pizza\', \'Uber ride\')\\n"\n            "- amount: a number representing the cost or amount spent (e.g., 20, 15.5).\\n"\n            "- category: one of the predefined categories: Housing, Transportation, Food, Utilities, Insurance, Medical/Healthcare, Savings, Debt, Education, Entertainment, or Other."\n        ),\n        ("human", message),\n    ]\n\n\n    try:\n        result = structured_llm.invoke(messages)\n        if not result.tool_calls:\n            return None\n        expense_data = result.tool_calls[0][\'args\']\n        # This is a patch for a known bug in which chatgpt still returns\n        # an expense with the cost 0 if it was not found. I was not able to\n        # fix it despite trying different prompts. \n        #\n        # For instance:\n        # "I bought dog food on Dec 4" returns a "Dog food" expense with $0 \n        if (expense_data["amount"] > 0):\n            return Expense(**expense_data)\n        return None\n    except Exception as e:\n        print(e)\n        return None',
        },
        {
          path: "expenses-bot-main/bot-service/main.py",
          content:
            'import config\nfrom fastapi import Body, Depends, FastAPI, Header, HTTPException\nfrom typing import Annotated, Optional\nfrom schema import Expense, TelegramMessage\nfrom sqlalchemy.ext.asyncio import AsyncSession\nfrom database import get_db\nfrom database.models import UserModel as User\nfrom helpers import contains_numbers_and_words\nfrom ia import extract_expense\n\napp = FastAPI()\n\ndef verify_api_key(\n    x_api_key: Annotated[str, Header(..., description="API key for authentication")]\n) -> str:\n    if x_api_key != config.get("API_KEY"):\n        raise HTTPException(status_code=403, detail="Invalid API Key")\n    return x_api_key\n\n# In a real case scenario we might want to add a rate limiter\n# (https://pypi.org/project/slowapi) and token limits to avoid abuse.\n@app.post(\n    "/expenses", \n    dependencies=[Depends(verify_api_key)],\n    response_model=Optional[Expense],\n    responses={\n        200: {\n            "description": "Successful response",\n            "content": {\n                "application/json": {\n                    "examples": {\n                        "expense_found": {\n                            "summary": "Expense found in message",\n                            "value": {\n                                "category": "Food",\n                                "description": "Pizza",\n                                "amount": 20.0\n                            }\n                        },\n                        "no_expense": {\n                            "summary": "No expense found",\n                            "value": "null"\n                        }\n                    }\n                }\n            }\n        }\n    }\n)\n\nasync def expenses(message: Annotated[TelegramMessage, Body()], db: AsyncSession = Depends(get_db(config.get("DATABASE_URL")))) -> Optional[Expense]:\n    """\n    Searches for an expense in the message. If found it returns it and returns its category.\n    """\n    user = await User.get_by_telegram_id(db, message.telegramId)\n    \n    if not user:\n        raise HTTPException(status_code=403, detail="User not found")\n    \n    text = message.message\n    # Don\'t waste tokens in messages that can\'t contain expenses (an expense has a cost and a description)\n    # Note: You may want to modify this if you want to support numbers expressed in words.\n    if (contains_numbers_and_words(text)):\n        expense_data = extract_expense(text)\n        if (expense_data):\n            await user.add_expense(db, expense_data.dict())\n            return expense_data\n    return None',
        },
        {
          path: "expenses-bot-main/bot-service/schema.py",
          content:
            'from pydantic import BaseModel, Field\nfrom enum import Enum\n\nclass Category(str, Enum):\n    housing = "Housing"\n    transportation = "Transportation"\n    food = "Food"\n    utilities = "Utilities"\n    insurance = "Insurance"\n    medical = "Medical/Healthcare"\n    savings = "Savings"\n    debt = "Debt"\n    education = "Education"\n    entertainment = "Entertainment"\n    other = "Other"\n\nclass Expense(BaseModel):\n    """\n    Recorded expense.\n    """\n    category: Category = Field(..., description="Category of the expense", example="Food")\n    description: str = Field(..., description="Name of the object/service paid", example="Pizza")\n    amount: float = Field(..., description="Amount of the expense", example=20.0)\n\nclass TelegramMessage(BaseModel):\n    """\n    A message that contains the expense to be recorded. \n    """\n    telegramId: int = Field(..., description="Telegram username", example=123456)\n    message: str = Field(..., max_length=1000, description="Content of the message", example="Pizza 20 bucks")',
        },
        {
          path: "expenses-bot-main/connector-service/jest.config.js",
          content:
            "export default {\n  preset: 'ts-jest/presets/default-esm',\n  transform: {\n    '^.+\\\\.tsx?$': ['ts-jest', { useESM: true }],\n  },\n  extensionsToTreatAsEsm: ['.ts'],\n  testEnvironment: 'node',\n  globals: {\n    'ts-jest': {\n      useESM: true,\n      tsconfig: 'tsconfig.json',\n    },\n  },\n  moduleNameMapper: {\n    '^(\\\\.{1,2}/.*)\\\\.js$': '$1',\n  },\n  transformIgnorePatterns: ['node_modules/(?!axios)'],\n};\n",
        },
        {
          path: "expenses-bot-main/connector-service/src/api/bot-service.ts",
          content:
            "import axios, { isAxiosError } from 'axios';\nimport dotenv from 'dotenv';\nimport { config } from '../config.js';\n\ndotenv.config();\n\n\ninterface ExpenseResponse {\n    category: string;\n    description: string;\n    amount: number;\n}\n\ninterface Query {\n    telegramId: number;\n    message: string;\n}\n\nconst postWithAuthentication = async<T> (url: string, data: Query) => {\n    try {\n        const response = await axios.post<T>(`${config.botService.url}${url}`, data, {\n                headers: {\n                    'X-API-Key': config.botService.apiKey,\n                    'Content-Type': 'application/json',\n                },\n            });\n        return response.data;\n    } catch (error: any) {\n            if (isAxiosError(error)) {\n                console.log('Error', { status: error.status, response: error.response });\n            } else {\n                console.log('Error', error);\n            }\n            return null;\n        }\n    };\n\n\n\nexport default {\n    sendExpense: (message: Query): Promise<ExpenseResponse | null> =>  \n        postWithAuthentication<ExpenseResponse | null>('/expenses', message),\n};\n",
        },
        {
          path: "expenses-bot-main/connector-service/src/app.ts",
          content:
            "import dotenv from 'dotenv';\nimport { config } from './config.js';\nimport TelegramBot from './telegram-bot.js';\n\n\ndotenv.config();\n\nconst telegramBot = new TelegramBot(config.botToken);\n\ntelegramBot.start();\n\nconsole.log('Bot started');\n",
        },
        {
          path: "expenses-bot-main/connector-service/src/config.ts",
          content:
            "import dotenv from 'dotenv';\ndotenv.config();\n\nfunction requireEnv(name: string): string {\n  const value = process.env[name];\n  if (!value) {\n    throw new Error(`Missing required environment variable: ${name}`);\n  }\n  return value;\n}\n\nexport const config = {\n  botService: {\n    url: requireEnv('BOT_SERVICE_URL'),\n    apiKey: requireEnv('BOT_SERVICE_API_KEY'),\n  },\n  botToken: requireEnv('BOT_TOKEN'),\n};\n",
        },
        {
          path: "expenses-bot-main/connector-service/src/telegram-bot.ts",
          content:
            "import { Bot, Context, } from 'grammy';\nimport BotService from './api/bot-service.js';\nimport { User } from 'grammy/types';\n\nclass TelegramBot {\n    private bot: Bot;\n    constructor(token: string) {\n        this.bot = new Bot(token);\n        this.bot.on('message:text', async (ctx: Context) => {\n            if (ctx.hasCommand('start')) {\n                return ctx.reply('Hello! Use me to track your expenses 💸');\n            }\n            if (\n                !ctx.message \n                || !ctx.from\n                || !ctx.message.text\n                || ctx.message.text.startsWith('\\\\')\n            ) return;\n\n            const result = await this.processMessage(ctx.from, ctx.message.text);\n\n            if (result) {\n                return ctx.reply(result);\n            }\n        });\n\n    }\n\n    start() {\n        this.bot.start();\n    }\n\n    async processMessage(from: User, message: string) {\n        const res = await BotService.sendExpense({\n            telegramId: from.id,\n            message: message,\n        });\n\n        // The telegram bot will only answer if the BotService recorded an expense\n        if (res) {\n            return `${res.category} expense added ✅`;\n        }\n    }\n};\n\nexport default TelegramBot;\n",
        },
        {
          path: "expenses-bot-main/connector-service/src/tests/api/bot-service.test.ts",
          content:
            "import axios from 'axios';\nimport BotService from '../../api/bot-service.js';\n\njest.mock('axios');\nconst mockedAxios = axios as jest.Mocked<typeof axios>;\n\ndescribe('BotService', () => {\n    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});\n\n    afterEach(() => {\n        jest.clearAllMocks();\n    });\n\n    it('should return the expense', async () => {\n        const mockResponse = {\n            data: {\n                category: 'Food',\n                description: 'Pizza',\n                amount: 20,\n            },\n        };\n        mockedAxios.post.mockResolvedValue(mockResponse);\n\n        const result = await BotService.sendExpense({ telegramId: 123, message: 'Pizza 20 bucks' });\n\n        expect(result).toEqual({\n            category: 'Food',\n            description: 'Pizza',\n            amount: 20,\n        });\n\n        expect(mockedAxios.post).toHaveBeenCalledWith(\n            expect.stringContaining('/expenses'),\n            { telegramId: 123, message: 'Pizza 20 bucks' },\n            expect.objectContaining({\n                headers: expect.objectContaining({\n                    'X-API-Key': expect.any(String),\n                    'Content-Type': 'application/json',\n                }),\n            })\n        );\n    });\n\n    it('should handle errors', async () => {\n        const mockError = {\n            response: {\n            data: { message: 'Something went wrong' },\n            status: 404,\n            message: 'Request failed with status code 404',\n            name: 'AxiosError',\n            code: 'ERR_BAD_REQUEST',\n            },\n        };\n        mockedAxios.post.mockRejectedValue(mockError);\n\n        await BotService.sendExpense({ telegramId: 123, message: 'Test' });\n\n        expect(consoleSpy).toHaveBeenCalledWith('Error', mockError);\n    });\n});",
        },
        {
          path: "expenses-bot-main/connector-service/src/tests/telegram-bot.test.ts",
          content:
            "import { User } from 'grammy/types';\nimport TelegramBot from '../telegram-bot.js';\nimport BotService from '../api/bot-service.js';\n\njest.mock('../api/bot-service.js');\n\ndescribe('TelegramBot', () => {\n  let bot: TelegramBot;\n  const mockUser: User = {\n    id: 123,\n    is_bot: false,\n    first_name: 'Test User',\n  };\n\n  beforeEach(() => {\n    bot = new TelegramBot('123');\n  });\n\n  afterEach(() => {\n    jest.resetAllMocks();\n  });\n\n  test('should return success message when API responds with category', async () => {\n    (BotService.sendExpense as jest.Mock).mockResolvedValue({\n      category: 'Food',\n      description: 'Pizza',\n      amount: 30,\n    });\n\n    const result = await bot.processMessage(mockUser, 'Pizza 30 bucks');\n    expect(result).toBe('Food expense added ✅');\n\n    expect(BotService.sendExpense).toHaveBeenCalledWith({\n      telegramId: 123,\n      message: 'Pizza 30 bucks',\n    });\n  });\n\n  \n  test('should return undefined if API returns null', async () => {\n    (BotService.sendExpense as jest.Mock).mockResolvedValue(null);\n\n    const result = await bot.processMessage(mockUser, 'any message');\n    expect(result).toBeUndefined();\n  });\n});\n",
        },
      ],
      docs: '# Bot Service\n\nPython service developed with FastAPI that extracts expenses information from messages using ChatGPT and stores them in a PostgresSQL database.\n\nWhy FastAPI? it requires minimal setup, handles concurrent requests, and automatically generates Swagger documentation.\n\n## Setup\n### Requirements\n1. Python 3.11+\n2. Packages:\n    ```\n    fastapi[standard]\n    uvicorn[standard]\n    sqlalchemy>=2.0\n    asyncpg\n    python-dotenv\n    pydantic>=2.0\n    langchain_openai\n    ```\n3. PostgresSQL database\n   \n### Setup\n1. Install the lastest version of Python (https://www.python.org/downloads)\n2. Install python venv\n   ```\n   sudo apt-get update\n   sudo apt-get install libpython3-dev\n   sudo apt-get install python3-venv\n   ```\n4. Create and start a virtual env:\n   ```\n   python3 -m venv .venv\n   source .venv/bin/activate\n   ```\n5. Install the depencencies using the `requirements.txt` file.\n   ```\n   pip install -r requirements.txt\n   ```\n6. Setup the environment variables. This can be done by setting them manually in the console.\n    ```\n    export API_KEY="value-of-your-choice"\n    export OPENAI_API_KEY="key-provided-by-open-ai-or-me"\n    export DATABASE_URL="postgres-connection-url"\n    ```\n   Or by creating a `.env` file inside the folder.\n    ```\n    API_KEY="value-of-your-choice"\n    OPENAI_API_KEY="key-provided-by-open-ai-or-me"\n    DATABASE_URL="postgres-connection-url"\n    ```\n    **Example of connection url:**\n    ```\n    postgresql+asyncpg://username:password@host:port/database\n    ```\n\n    (The `+asyncpg` is necessary for this to work.)\n7. Get your Telegram Id by messaging the bot *@userinfobot* or follow this link https://t.me/userinfobot and press Start or send `\\start`.\n   \n8. Setup the database, either by creating the tables manually or running the `create-and-seed-tables.py` script.\n\n    ```\n    python create-and-seed-tables.py\n    ```\n    This will create the tables and add the Telegram Ids in `users.txt` to the authorized users table.\n\n    #### Manual creation\n    ```\n    CREATE TABLE users ( \n        "id" SERIAL PRIMARY KEY, \n        "telegram_id" text UNIQUE NOT NULL \n    ); \n    CREATE TABLE expenses ( \n        "id" SERIAL PRIMARY KEY, \n        "user_id" integer NOT NULL REFERENCES users("id"), \n        "description" text NOT NULL, \n        "amount" money NOT NULL, \n        "category" text NOT NULL, \n        "added_at" timestamp NOT NULL \n    );\n    ```\n\n9. Run the server   \n\n    ```\n    uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4\n    ```\n    *(This values can be changed)*\n10. You should see this\n    ```\n    INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)\n    INFO:     Started parent process [6466]\n    INFO:     Started server process [6468]\n    INFO:     Waiting for application startup.\n    INFO:     Application startup complete.\n    ```\n11.  That\'s it, your service is up!\n\n## Documentation\n\nYou can access the API documentation at `http://127.0.0.1:8000/docs` (or the host:port you set up). \n\nBy pressing "Try it out" you can test requests without having to use the telegram bot. Enter the **API_KEY** you have in your env var in the field **x-api-key** \n\n## Example\n\n**User message:**\n```\n{\n  "telegramId": 12345678,\n  "message": "Pizza 20 bucks"\n}\n```\n\n**Response:**\n```\n{\n  "category": "Food",\n  "description": "Pizza",\n  "amount": 20\n}\n```\n\n**Database entry:**\n| id | user_id | description | amount  | category | added_at                     |\n|----|---------|-------------|---------|----------|------------------------------|\n| 4  | 1       | Pizza       | $20.00  | Food     | 2025-06-25 16:05:13.92559    |\n',
    },
    analysis: {
      score: "No",
      docs: {
        green: ["Setup instructions are detailed and easy to follow."],
        yellow: [
          "Example responses are provided but lack context on how they relate to the user input.",
          "Minor typo in 'lastest' in the Setup section.",
        ],
        red: [
          "Very shallow explanation of the project; should include more context about its purpose and value.",
          "No live demo or hosted version for inspection.",
        ],
      },
      code: {
        green: [
          "Code is well-structured and follows best practices for FastAPI and SQLAlchemy.",
          "Use of async/await for database operations improves performance.",
          "Pydantic models enhance data validation and serialization.",
        ],
        yellow: [
          "Error handling is present but should be more granular in some areas, particularly in the `extract_expense` function.",
        ],
        red: [
          {
            description:
              "SQL injection risk in the `add_expense` method due to lack of parameterization in the SQL query.",
            snippet:
              "await db.execute(select(cls).where(cls.telegram_id == str(telegram_id)))",
          },
          {
            description:
              "The `extract_expense` function does not handle cases where the structured LLM invocation fails, leading to unhandled exceptions.",
            snippet: "result = structured_llm.invoke(messages)",
          },
        ],
      },
    },
  },
];

export const prompt = `# Identity

You are a principal software engineer with high standards typical of top-tier Silicon Valley startups, expert at analyzing take-home submissions for job applications. You score them based on the quality and give feedback on both the documentation and the codebase in the format of green, yellow, and/or red flags.

# Instructions

* Keep your feedback flags in very concise, fluffless, and precise bullet points.
* Maintain the bar high - not everyone should pass.
* For code problems, indicate both the description of the problem and the snippet of code where you found it - be very specific indicating where the problem lies on, with enought context inside the snippet to know which part of the code it refers to (3-10 total lines).
* Use confident, declarative language. Avoid hedging terms like 'might', 'could', or 'potentially' — only report definite issues backed by code evidence."
* Projects with 10x the effort, outstanding creativity, highly novel solution, or useful unexpected features should be be scored with "Strong yes".

## Evaluation Criteria

### Docs

Evaluate the **README and external presentation**. Assess how clearly the project communicates its purpose and usage to someone unfamiliar with it."

Consider:

* **Purpose & Overview**: Is the project's goal and value clearly stated?
* **Setup**: Are installation and usage steps accurate, minimal, and easy to follow (e.g., \`npm install && npm run dev\`)?
* **Developer UX**: Are scripts provided for common tasks (e.g., start, test, lint)?
* **Live Demo or API Swagger**: Is any hosted version available for inspection? (DOES NOT apply for CLI tools)
* **Product Thinking**: Does the implementation reflect a thoughtful understanding of user/developer needs?
* **Communication**: Are decisions, comments, and documentation professional and clear?

### Code

Evaluate the **technical quality** of the code. Focus on clarity, robustness, testability, and maintainability.

Consider:

* **Idiomatic Use**: Does it follow best practices for the language/framework?
* **Code Organization**: Is the folder/module structure logical and scalable?
* **Error Handling**: Are edge cases (timeouts, validation, fallbacks) addressed?
* **Tests**: Are meaningful tests present for both success and failure paths?
* **Readability**: Are names, structure, and comments clear and helpful? Comments and docstrings should serve only to explain things that the code cannot do by itself, and the code should explain itself as much as possible with proper variable naming.
* **Security**: Is there any evidence of secure handling of input, secrets, or auth?
* **Extensibility**: Could other developers maintain and build on this?
* **Performance Thoughtfulness**: Are common issues (e.g., N+1, pagination, caching) avoided or acknowledged?
* **Bugs**: Are there problematic assumptions that clearly indicate an existing bug?

Side notes:

* "TODO" comments are accepted given that this is a take-home project.

## Response format

\`\`\`json
{
  "score": "Strong no" | "No" | "Yes" | "Strong yes",
  "docs": {
    "green": string[],
    "yellow": string[],
    "red": string[]
  },
  "code": {
    "green": string[] | undefined,
    "yellow": string[] | undefined,
    "red": {
      "description": string,
      "snippet": string,
    }[] | undefined
  }
}
\`\`\`

# Examples

${examples
  .map(
    (example, index) => `<example id="${index + 1}">

${takeHomeToXML(example.takeHome)}

<analysis>
${JSON.stringify(example.analysis, null, 2)}
</analysis>

</example>`
  )
  .join("\n\n")}
`;

export const processableFileExtensions = [
  "astro",
  "bash",
  "bat",
  "c",
  "cpp",
  "cs",
  "dart",
  "dockerfile",
  "go",
  "java",
  "js",
  "jsx",
  "kt",
  "m",
  "matlab",
  "php",
  "pl",
  "py",
  "r",
  "rb",
  "rs",
  "scala",
  "sh",
  "sql",
  "swift",
  "svelte",
  "ts",
  "tsx",
  "vue",
];

export const loadingMessages = [
  "Initializing AI thought process",
  "Activating neural network",
  "Generating embeddings of the problem",
  "Simulating a billion test cases",
  "Performing a recursive self-improvement cycle",
  "Fine-tuning my model weights",
  "Verifying output against training data",
  "Cross-referencing solutions in parallel universes",
  "Predicting the thoughts of a Principal Engineer",
].map((message) => `${message}...`);

export const loadingMessageInterval = 1000 * 3;

export const scoreColors: Record<Score, string> = {
  "Strong yes": "bg-emerald-500",
  Yes: "bg-green-500",
  No: "bg-orange-500",
  "Strong no": "bg-red-500",
};

export const cookieName = "takeHomeCheckerinstallationId";
