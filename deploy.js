import { execSync } from 'child_process'

// Деплой через Vercel
console.log('Building frontend...')
execSync('npx vite build', { stdio: 'inherit', cwd: process.cwd() })

console.log('Deploying to Vercel...')
try {
  execSync('npx vercel --prod --yes', { stdio: 'inherit', cwd: process.cwd() })
} catch (e) {
  console.log('Vercel needs login. Trying Netlify drop...')
  execSync('npx netlify deploy --dir=dist --prod', { stdio: 'inherit', cwd: process.cwd() })
}
