import { Hammer, Twitter, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-cream-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-burnt-500 flex items-center justify-center">
                <Hammer className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">BuildMate</span>
            </div>
            <p className="text-sm text-cream-400 max-w-sm">
              The UK's trusted marketplace connecting customers with verified tradespeople. Post jobs, receive quotes, and hire with confidence.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-3">For Customers</h3>
            <ul className="space-y-2 text-sm">
              <li>Post a Job</li>
              <li>Browse Tradespeople</li>
              <li>How It Works</li>
              <li>Verified Reviews</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-3">For Tradespeople</h3>
            <ul className="space-y-2 text-sm">
              <li>Join BuildMate</li>
              <li>Pricing Plans</li>
              <li>Lead Feed</li>
              <li>Quoting Tools</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-cream-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-cream-500">© 2026 BuildMate. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-cream-400 hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
            <a href="#" className="text-cream-400 hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
