import { motion } from "framer-motion";

const LoadingBanner = () => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="grid grid-cols-1 md:grid-cols-2 gap-6"
  >
    <div className="bg-background rounded-lg shadow p-6 space-y-4">
      <div className="h-8 bg-foreground/20 rounded w-1/3 animate-pulse"></div>
      <div className="h-4 bg-foreground/20 rounded w-2/3 animate-pulse"></div>
      <div className="space-y-3 mt-6">
        <div className="h-4 bg-foreground/20 rounded w-1/2 animate-pulse"></div>
        <div className="h-20 bg-foreground/20 rounded animate-pulse"></div>
      </div>
    </div>

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
