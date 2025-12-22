import json
from pathlib import Path

import yt_dlp
from dotenv import dotenv_values
from openai import OpenAI
from pydub import AudioSegment
from slugify import slugify
from tqdm import tqdm

PODCAST_URL = "https://www.youtube.com/playlist?list=PLrtLMjKidFAvi_CTWo5WQV3_X_E5FoaNg"
PODCAST_BITRATE_KBPS = 128

TRANSCRIPTIONS_MAX_AUDIO_SIZE_MB = 25

PARSING_PROMPT = """# Identity

You are a professional interpreter. Your goal is to convert raw transcripts from a podcast to publishable web content in **Markdown** format. That means fixing transcription errors and making adjustments that inherently come with the desired text format. You don't cut off the episode—you always finish parsing them completely.

# Context

You're given the raw transcript of a podcast episode related to tech.

## Language

If the episode is in Spanish, the intended dialect is Rioplatense. That means that some words are slightly different and some vocabulary varies, for example:

* "tenés" instead of "tienes"
* "querés" instead of "quieres"
* "vos" instead of "tu"

Besides, there will probably be words in English mixed with Spanish (like "e-commerce", "bug", "top of mind", "behavioral", "resume", and many more) or transformation of English words into a Spanish version, such as:

* fix/arreglar -> fixear/fixeado/fixeó/etc
* book/agendar -> bookear/bookeado/bookeó/etc
* code/codificar -> codear
* pitch/presentar -> pitchear

We want to keep those words that way.

Otherwise, the episode may be in English.

## Structure

The transcript usually starts with hooks, which are excerpts of the episode that appear later. They should be:

* formatted as quotes using Markdown syntax
* be each in a different paragraph

# Task

You have to revise the text to fix all errors you encounter and make the required adjustments.

## Adjustments

* Keep the intended language with all its specifications detailed above.
* Remove any filler words that can be removed while keeping the meaning and tone of the sentence exactly as before. IMPORTANT: Never change the meaning of sentences and always keep every single detail of information available in the transcript.
* Ignore ANY reference to <Amara.org>. Do NOT include the sentence that references it.

### Paragraphs and structure

* Split into paragraphs based on the context of the sentences.
* If many paragraphs are related to the same topic, group them into a section using Markdown heading below H1. Do NOT use H1 header (`#`), and make sure that the first heading isn't what the entire episode overall talks about—if that's the case, just omit it.
* Separate hooks, main content, and promos from each other with Markdown separation lines (`---`). Do NOT include a separation line at the last line of the file.
* For dialogs, add an em-dash (`—`) every time the speaker changes.

### Conversions

* If it says "arroba", "con doble t", or similar while referencing Conanbatt, remove the phrases that indicate how it's spelled and simply replace it with [@Conanbatt](https://x.com/Conanbatt).
* Convert all mentions of years and quantities to numeric format.
* Convert "por ciento" to its symbol, "%"
* Based on the context, add quotes whenever it corresponds to.

## Spellings

Below is a list of names that may be mentioned in the podcast, followed by their incorrect spellings. Based on the context, if you find out that they are mentioned, either with these incorrect spellings or any other variations, fix the spelling. If only a part of that name is mentioned, fix the spelling of that part only. Add the corresponding link only the first time they are mentioned.

Additionally, if you find out that a word has been transcribed incorrectly based on the context, you should also fix it, even if it's not in the list below.

### People

* [Gabriel Benmergui](https://www.linkedin.com/in/gabriel-benmergui/) (author of the podcast, Silver.dev's CEO and founder): "Ben Mergui", "ben margy", "Benmari", "Bemel"
* [Guillermo Rauch](https://rauchg.com) (Vercel's CEO and founder): "Guillermo Roush", "Guiyermo Raush"
* [Nicolás Pujia](https://nicolaspujia.com) (Silver.dev's intern): "Nicolas Pugia", "Nikolas  Pushia", "Nicholas Poo hee A", "Nicolas Fugia"
* [Lautaro Paskevicius]: "pasque", "Pasquevicius", "pasqueviyus"
* [Andrés (Andy) Koiffman]: "coifman"
* [Pato Rocca](https://www.linkedin.com/in/patriciorocca/): "pato roca"
* [Nicolás Bevacqua](https://www.linkedin.com/in/nbevacqua/): "nicolas bebacua", "Nikolas Vevakua", "Nicolás Bebak"
* [Dax Raad](https://x.com/thdxr): "dacs", "dacs raaad"
* [Peter Thiel](https://foundersfund.com/team/peter-thiel/): "piter tiel"
* [Manuel Beaudroit](https://ar.linkedin.com/in/mbeaudroit): "manuel boudra", "manu boudra", "manuel beaudrot"
* [Pablo Fernández](https://x.com/fernandezpablo): "pablo fernandes"
* [Pablo Vittori](https://www.linkedin.com/in/pablovittori/) (CTO at Making Sense, former CTO at Globant, founder of BeApp): "Vitorie", "Vittorri"
* [Antonio García-Martínez](https://en.wikipedia.org/wiki/Antonio_Garc%C3%ADa_Mart%C3%ADnez_(author)) (author of "Chaos Monkeys", former Facebook PM, AdGrok founder): "Garcia Martinez", "Garcia-Martinez", "Antonio Garcia", "AGM"
* [Max Brunsfeld](https://zed.dev/team) (co-founder of Zed editor, creator of Tree-sitter, former Atom team): "Brunsfield", "Brunsfelt", "Max Brunsfield"
* [Gabriel Gruber](https://www.linkedin.com/in/gabrielgruber/) (CEO at Exactly Finance, former CEO at Properati): "Grube"
* [Pablo Dorado](https://www.linkedin.com/in/pablo-dorado-26633a45/) (Sales & Operations Manager at Botmaker): "Dorrado"
* [Leandro Malandrini](https://ar.linkedin.com/in/leandromalandrini) (Chief Product Officer at PedidosYa, former Despegar): "Malandriny", "Malandrin"
* [Anabella Guimarey](https://www.linkedin.com/in/anabellaguimarey/) (CEO at elcerokm, Technical Project Manager): "Gimarey", "Guimaray", "Anabela"
* [Martín Gontovnikas](https://www.linkedin.com/in/mgonto/?locale=en_US) (co-founder and former CTO of Auth0): "gonto", "Gontovnickas"
* [Damián Catanzaro](https://damiancatanzaro.com/) (founder and CTO of Cafecito.app, CTO at Amplify): "Catanzarro", "Damian Catanzaro"
* [Beltrán Briones](https://estudiokohon.com/analisis-del-mercado-inmobiliario-actual-de-argentina/) (Director Financiero at Estudio Kohon, real estate influencer): "Beltran Briones", "Beltran"
* [Alejandro Crosa](https://www.alejandrocrosa.com/) (CTO and co-founder at Daffy, former LinkedIn/Twitter/Slack): "Crossa"
* [Damián Schenkelman](https://staffeng.com/stories/damian-schenkelman/) (Principal Architect at Auth0/Okta, aka "Yenkel"): "Shenkelman", "Schenkleman", "Yenkel", "Damian Schenkelman"
* [Daniel Benmergui](https://en.wikipedia.org/wiki/Daniel_Benmergui) (indie game designer, Gabriel Benmergui's brother, creator of "Storyteller", "Today I Die"): "Ben Mergui", "Benmergi", "Daniel Ben Mergui"
* [Felipe Damonte](https://www.linkedin.com/in/fela/) (Investment Associate at Newtopia VC): "Damont"
* [Rodrigo Vidal](https://www.linkedin.com/in/rodrigovidal05/) (CEO at Wallbit, YC W23): "Bidel"
* [Martín Borchardt](https://www.endeavor.org.ar/blog-article-inspiracion-hermanos-academia-educa-gratis-trabajo/) (CEO and co-founder of Henry, former founder of Nubi): "Borchard", "Borchart", "Martin Borchardt"
* [Ramiro Roballos](https://www.linkedin.com/in/ramiro-roballos/) (CEO at Tukki.ai, former McKinsey): "Robalos", "Robayos"
* [Valentín Schmidt](https://www.linkedin.com/in/valentin-oscar-schmidt/) (works at AWS, formerly Argentina): "Schmitt", "Valentin Schmidt"
* [Marcos Galperin](https://es.wikipedia.org/wiki/Marcos_Galperin) (Mercado Libre founder): "Marcos Alperín"
* [Martín Migoya](https://www.linkedin.com/in/migoya/?originalSubdomain=ar) (Globant co-founder): "Martín Magoya", "Martín mi joya"
* [Pierpaolo Barbieri](https://es.wikipedia.org/wiki/Pierpaolo_Barbieri) (Ualá founder): "Pierpa", "Pier Paolo Barbero"
* [Reid Hoffman](https://www.linkedin.com/in/reidhoffman/): "jofman"

### Companies

* [Silver.dev](https://silver.dev): "silver", "Silver Dev", "Silverdev", "cilber", "silver dat dev"
* Kaya.gs: "kaia je ese", "kaya", "calla ge ese"
* Reva: "reva", "reba
* [OpenSea](https://opensea.io/): "Open C", "open sea"
* [Robinhood](https://robinhood.com/): "robinhood", "robin jud"
* [Circle Medical](https://www.circlemedical.com/): "cirkel medical", "circol medical", "circle medical"
* [quipteams](https://www.quipteams.com/): "Quip", "kuip tims"
* [Ramp](https://ramp.com/): "ramp", "ramb"
* [Anduril](https://www.anduril.com/): "andiuril"
* [Palantir](https://www.palantir.com/): "palantir"
* [Ring](https://ring.com): "ring", "Rin"
* [Vercel](https://vercel.com): "ber sel"
* [Deviget](https://www.deviget.com/): "devi guet", "dev ai guet"
* [Nubank](https://international.nubank.com.br/about/): "niu bank", "nu bank"
* [Wallbit](https://www.wallbit.io/en): "wall bit", "gual bit"
* [Henry](https://www.soyhenry.com/): "jenri", "soy Herny"
* [Exactly](https://exact.ly/): "exactly"
* [Belo](https://belo.app/): "velo"
* [elcerokm](https://elcerokm.com/): "el cero ca eme", "el cero k m", "El Cero KM"
* [Newtopia VC](https://newtopia.vc/): "new topia"
* [Auth0](https://auth0.com/): "autcero", "auth zero", "aut cero"
* [Etermax](https://www.etermax.com/es/about): "éter max"
* [Bairesdev](https://baires.dev/): "baires dev"
* [AreaTres](https://www.areatresworkplace.com/): "area tres", "area 3", "Aria 3"
* Mercado Libre: "meli", "mercado libre", "MercadoLibre"
* LinkedIn: "Linke in", "Linked in", "Linkdin", "linquedin"
* GitHub: "Git hab", "Githab", "Gitub", "guit jab"
* Andreessen Horowitz: "andrisen jorobuits", "andrisen Enhorowicz"
* Y Combinator/YC: "uai combineitor", "guai sí", "why combinator", "wai combinator", "i combinator", "YC", "Y C"
* AWS: "ei doble u es", "a w s"
* Slack: "eslack", "Slak"
* Google: "Guguel", "Gugle"
* Meta: "meta", "Metta"
* Facebook: "Feisbuk", "Faisbook"
* Twitter/X: "Tuiter", "Twiter", "ex dot com"
* Microsoft: "macro soft", "Microsof"
* Amazon: "Amazón", "Amazone"
* Apple: "Apol", "Eipel", "apel"
* Tesla: "Tesle", "Tezla"
* OpenAI: "Open ei ai", "Open A I"
* Anthropic: "Antropic", "Antrophic"
* Stripe: "Straip", "Estraip"
* Airbnb: "Eirbienbí", "Air B and B", "ear bi an bi"
* Uber: "Iuber", "uver"
* Netflix: "Netflis", "Netfliks"
* Spotify: "Espotifai", "Spotifai"
* Globant: "Globan", "Glovant"
* Rappi: "Rapi", "Rapy"
* PedidosYa: "pe ya", "pedidos ya"
* Reddit: "redit"
* J. P. Morgan: "JP Morgan"

### Misc

* [@Conanbatt](https://x.com/Conanbatt) (Gabriel Benmergui's Twitter handle): "Conanbatt", "Conanbat", "Conan bat", "Konan Bat", "Konan Batt"
* [Tecnología Informal](https://silver.dev/podcast) (Gabriel Benmergui's podcast): "tecnología informal"
* [Interview Ready](https://ready.silver.dev) (Gabriel Benmergui's course): "interview ready"
* [ShipBA](https://www.shipba.dev/) (hackathon): "yip bea", "yip bi ei", "Ship BEI", "JPEA"
* [Storyteller](https://en.wikipedia.org/wiki/Storyteller_(video_game)) (Daniel Benmergui's famous video game): "story teller"
* [Zed](https://zed.dev/) (code editor): "sed"
* [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) (parser generator tool): "TreeSitter", "tri siter", "tree sitter"
* [Next.js](https://nextjs.org): "nexty", "Next JS"
* [r/devsarg](https://reddit.com/r/devsarg) (Reddit community): “DevSarg”, “devs arg”
* [ChatGPT](https://chatgpt.com/): "chat gpt", "chat yi pi ti", "chat ge pe te", "chat G P T"
* LatAm (Latino America): "la TAM", "latam", "lat am"

### Common nouns

* crypto: "cripto", "krypto", "kripto"
* VC (venture capital): "vi sí", "v c", "bi C"
* startup: "start up", "star tap", "startop"
* equity: "ekuiti", "ekwity"
* founder: "faunder"
* developer: "debeloper", "develper"
* engineer: "inyinir", "engeneer"
* SaaS: "sas", "sass", "S A S"
* API: "ei pi ai", "a p i"
* MVP (Minimum Viable Product): "em vi pi", "m v p"
* IPO: "ai pi ou", "i p o"
* CEO: "si i ou", "c e o"
* CTO: "si ti ou", "c t o"
* CFO: "si ef ou", "c f o"
* AI (Artificial Intelligence): "ei ai", "a i"
* ML (Machine Learning): "em el", "m l"
* LLM (Large Language Model): "ele lem"
* bootstrap: "butstrap", "bootstrep"
* revenue: "rebeniu", "revenyu"
* valuation: "baluacion", "valuashon"
* fintech: "fintek", "fin tech"
* edtech: "edtek", "ed tech"
* proptech: "proptek", "prop tech
* kaia (wood used for Go boards): "calla"
"""

env = dotenv_values()
client = OpenAI(api_key=env["OPENAI_API_KEY"], timeout=3600)


def main():
    content_path = Path("./content")

    metadata_path = content_path / "metadata"

    audio_path = content_path / "audio"
    raw_audio_path = audio_path / "raw"
    compressed_audio_path = audio_path / "compressed"

    transcripts_path = content_path / "transcripts"
    raw_transcripts_path = transcripts_path / "raw"
    parsed_transcripts_path = transcripts_path / "parsed"

    metadata_path.mkdir(exist_ok=True, parents=True)
    raw_audio_path.mkdir(exist_ok=True, parents=True)
    compressed_audio_path.mkdir(exist_ok=True, parents=True)
    raw_transcripts_path.mkdir(exist_ok=True, parents=True)
    parsed_transcripts_path.mkdir(exist_ok=True, parents=True)

    # download(
    #     "https://www.youtube.com/watch?v=ZWbwIHD9oAo&list=PLrtLMjKidFAvi_CTWo5WQV3_X_E5FoaNg&index=2&t=38s",
    #     raw_audio_path,
    #     metadata_path,
    # )
    compress(raw_audio_path, compressed_audio_path)
    transcribe(compressed_audio_path, raw_transcripts_path)
    parse(raw_transcripts_path, metadata_path, parsed_transcripts_path)


def download(
    url: str,
    audio_dir: Path,
    metadata_dir: Path,
    template="%(playlist_index)s.%(ext)s",
):
    with yt_dlp.YoutubeDL(
        {
            "format": "mp3/bestaudio/best",
            "postprocessors": [
                {
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "mp3",
                }
            ],
            "outtmpl": {
                "default": str(audio_dir / template),
                "infojson": str(metadata_dir / template),
                "subtitle": str(metadata_dir / template),
            },
            "writeinfojson": True,
            "writesubtitles": True,
            "ignoreerrors": True,
        }
    ) as ydl:
        ydl.download(url)


def compress(original_audio_dir: Path, output_dir: Path, original_audio_format="mp3"):
    for f in tqdm(
        get_sorted_glob(original_audio_dir, f"*.{original_audio_format}"),
        desc="Preprocessing",
    ):
        output_file = output_dir / f"{f.stem}.mp3"
        if output_file.exists() and output_file.stat().st_size:
            continue
        audio: AudioSegment = AudioSegment.from_file(
            str(f), format=original_audio_format
        )
        duration_seconds = len(audio) / 1000
        target_bits = TRANSCRIPTIONS_MAX_AUDIO_SIZE_MB * 8 * 1024 * 1024
        bps = target_bits / duration_seconds
        safety_margin_kb = 5
        kbps = int(bps / 1024) - safety_margin_kb
        audio.export(output_file, bitrate=f"{kbps}k")


def transcribe(audio_dir: Path, output_dir: Path, model="whisper-1"):
    for f in tqdm(get_sorted_glob(audio_dir, "*.mp3"), desc="Transcription"):
        output_file = output_dir / f"{f.stem}.txt"
        if output_file.exists() and output_file.stat().st_size:
            continue
        transcription = client.audio.transcriptions.create(
            model=model,
            file=(f.name, f.read_bytes()),
        )
        output_file.write_text(transcription.text)


def parse(transcripts_dir: Path, metadata_dir: Path, output_dir: Path):
    for f in tqdm(get_sorted_glob(transcripts_dir, "*.txt"), desc="Parsing"):
        output_file = output_dir / f"{f.stem}.md"
        if output_file.exists() and output_file.stat().st_size:
            continue

        frontmatter_string = get_frontmatter_string(
            metadata_dir / f"{f.stem}.info.json"
        )

        response = client.responses.create(
            instructions=PARSING_PROMPT,
            input=f.read_text(),
            model="gpt-4.1",
            temperature=0,
        )

        output_file.write_text(f"{frontmatter_string}\n\n{response.output_text}")


def get_sorted_glob(path: Path, pattern: str) -> list[Path]:
    return sorted(
        path.glob(pattern), key=lambda f: int(f.stem) if f.stem.isdigit() else f.name
    )


def get_frontmatter_string(metadata_file: Path):
    metadata = json.loads(metadata_file.read_text())
    title_parts = metadata.get("title", "").rsplit(" | ")
    frontmatter = {
        "slug": slugify(title_parts[0]),
        "title": f'"{title_parts[0]}"',
        "date": metadata.get("release_timestamp"),
        "tags": metadata.get("tags"),
        "categories": metadata.get("categories"),
        "description": f"| \n  {metadata.get('description').replace('\n', '\n  ')}",
        "language": metadata.get("language"),
        "thumbnail": metadata.get("thumbnail"),
        "duration_seconds": metadata.get("duration"),
        "duration_string": metadata.get("duration_string"),
        "youtube_id": metadata.get("id"),
        "youtube_url": metadata.get("webpage_url"),
    }
    if len(title_parts) > 1:
        season, episode = title_parts[1][1:].split("E")
        frontmatter.update({"season": season, "episode": episode})

    return "\n".join(
        ["---", *[f"{k}: {v}" for k, v in frontmatter.items() if v], "---"]
    )


if __name__ == "__main__":
    main()
