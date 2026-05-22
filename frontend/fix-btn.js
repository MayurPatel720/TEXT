const fs = require('fs');
let file = fs.readFileSync('components/layout/index.tsx', 'utf8');

const oldTextRegex = /\) : \(\s*<div className="flex items-center gap-6">\s*<LocalTransitionLink href="\/login"[\s\S]*?<\/button>\s*<\/div>\s*\)/;

const newText = `) : (
              <div className="flex items-center gap-4 md:gap-6">
                <LocalTransitionLink href="/login" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors whitespace-nowrap">
                  Sign In
                </LocalTransitionLink>

                <button 
                  onClick={() => router.push("/studio")}
                  className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-[var(--accent)] text-white text-sm font-semibold hover:bg-[var(--accent-hover)] transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 whitespace-nowrap"
                >
                  Get Started
                </button>
              </div>
            )`;

file = file.replace(oldTextRegex, newText);

fs.writeFileSync('components/layout/index.tsx', file);
console.log("Tailwind button fix applied.");
