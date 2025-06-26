import { motion } from "framer-motion";

const LoadingBanner = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    <div className="space-y-4">
      <div className="h-12 bg-foreground/20 rounded animate-pulse"></div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-background p-4 rounded shadow-sm space-y-3">
          <div className="h-6 bg-foreground/20 rounded w-1/4 animate-pulse"></div>
          <div className="h-4 bg-foreground/20 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-foreground/20 rounded w-3/4 animate-pulse"></div>
        </div>
      ))}
    </div>
  </motion.div>
);

export default LoadingBanner;
