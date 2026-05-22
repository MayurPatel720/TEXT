const fs = require('fs');
let file = fs.readFileSync('components/layout/index.tsx', 'utf8');
const oldText = `            ) : (
              <>
                <LocalTransitionLink href="/login" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
                  Sign In
                </LocalTransitionLink>

                <button 
                  onClick={() => router.push("/studio")}
                  className="btn btn-primary px-4 py-2 text-sm"
                >
                  Get Started
                </button>

              </>
            )`;

const newText = `            ) : (
              <div className="flex items-center gap-6">
                <LocalTransitionLink href="/login" className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors whitespace-nowrap">
                  Sign In
                </LocalTransitionLink>

                <button 
                  onClick={() => router.push("/studio")}
                  className="btn btn-primary px-6 py-2.5 text-sm font-semibold rounded-full whitespace-nowrap"
                  style={{ minWidth: 'max-content' }}
                >
                  Get Started
                </button>
              </div>
            )`;

file = file.replace(oldText, newText);
fs.writeFileSync('components/layout/index.tsx', file);
console.log("Fixed!");
