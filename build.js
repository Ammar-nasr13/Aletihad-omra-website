const fs = require('fs');
const path = require('path');
const CleanCSS = require('clean-css');
const { minify: minifyJS } = require('terser');
const { minify: minifyHTML } = require('html-minifier-terser');

const rootDir = __dirname;
const srcDir = path.join(rootDir, 'src');

console.log('Starting optimization build script (Programmatic Mode)...');

// Helper to create directories
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// Instantiate CleanCSS
const cleanCss = new CleanCSS({ level: 2 });

// Async main build function
(async function main() {
    try {
        // 1. Backup original files to src/
        console.log('Backing up original source files to src/...');
        ensureDir(srcDir);
        ensureDir(path.join(srcDir, 'css'));
        ensureDir(path.join(srcDir, 'js'));

        const htmlFiles = ['index.html', 'programs.html', 'manasek.html', 'login.html', 'admin.html', '404.html', 'program-manasik.html', 'program-tawaf.html', 'program-maqam.html', 'program-siyaha.html'];
        const jsFiles = ['main.js', 'manasek.js', 'login.js', 'admin.js', 'appwrite-db.js', 'whatsapp-chat.js'];

        // Backup HTML files if not already backed up
        htmlFiles.forEach(file => {
            const destPath = path.join(srcDir, file);
            if (!fs.existsSync(destPath) && fs.existsSync(path.join(rootDir, file))) {
                fs.copyFileSync(path.join(rootDir, file), destPath);
                console.log(`Backed up: ${file}`);
            }
        });

        // Backup CSS files if not already backed up
        const cssFiles = ['styles.css'];
        cssFiles.forEach(file => {
            const destPath = path.join(srcDir, 'css', file);
            if (!fs.existsSync(destPath) && fs.existsSync(path.join(rootDir, 'css', file))) {
                fs.copyFileSync(path.join(rootDir, 'css', file), destPath);
                console.log(`Backed up CSS: ${file}`);
            }
        });

        // Backup JS files if not already backed up
        jsFiles.forEach(file => {
            const destPath = path.join(srcDir, 'js', file);
            if (!fs.existsSync(destPath) && fs.existsSync(path.join(rootDir, 'js', file))) {
                fs.copyFileSync(path.join(rootDir, 'js', file), destPath);
                console.log(`Backed up JS: ${file}`);
            }
        });

        // 2. Minify CSS
        console.log('Minifying CSS...');
        const cssContent = fs.readFileSync(path.join(srcDir, 'css', 'styles.css'), 'utf-8');
        const minifiedCss = cleanCss.minify(cssContent).styles;
        fs.writeFileSync(path.join(rootDir, 'css', 'styles.min.css'), minifiedCss, 'utf-8');
        console.log('Successfully minified css/styles.css -> css/styles.min.css');

        // 3. Minify JS
        console.log('Minifying JS files...');
        for (const file of jsFiles) {
            const srcPath = path.join(srcDir, 'js', file);
            const destPath = path.join(rootDir, 'js', file.replace('.js', '.min.js'));
            const jsContent = fs.readFileSync(srcPath, 'utf-8');
            const result = await minifyJS(jsContent, {
                compress: true,
                mangle: true
            });
            fs.writeFileSync(destPath, result.code, 'utf-8');
            console.log(`Successfully minified js/${file} -> js/${file.replace('.js', '.min.js')}`);
        }

        // 4. Critical CSS extraction
        // We take lines 1 to 468 of styles.css (reset, root, typography, navbar, hero) as critical CSS
        console.log('Generating Critical CSS...');
        const lines = cssContent.split('\n');
        const criticalCssRaw = lines.slice(0, 468).join('\n');
        const criticalCssMin = cleanCss.minify(criticalCssRaw).styles;
        console.log('Generated and minified Critical CSS.');

        // Local Font CSS definition
        console.log('Generating fonts.min.css...');
        const localFontCss = fs.readFileSync(path.join(rootDir, 'fonts', 'fonts.css'), 'utf-8');
        const fontsCssMin = cleanCss.minify(localFontCss).styles;
        fs.writeFileSync(path.join(rootDir, 'css', 'fonts.min.css'), fontsCssMin, 'utf-8');
        console.log('Generated css/fonts.min.css');

        // 5. Process HTML files
        console.log('Processing HTML files (Inlining CSS, preloads, WebP images, JS updates)...');

        for (const file of htmlFiles) {
            let html = fs.readFileSync(path.join(srcDir, file), 'utf-8');
            
            // Replace render-blocking styles.css with inlined Critical CSS and async styles.min.css loading
            const stylesCssPattern = /<link rel="stylesheet" href="css\/styles.css">/g;
            const asyncStyleReplacer = `<style id="critical-css">${criticalCssMin}</style>
            <link rel="stylesheet" href="css/styles.min.css" media="print" data-media="all" onload="this.media=this.dataset.media">
            <noscript><link rel="stylesheet" href="css/styles.min.css"></noscript>`;
            html = html.replace(stylesCssPattern, asyncStyleReplacer);

            // Replace script tags with .min.js and add versioning cache buster
            html = html.replace(/src="js\/appwrite-db.js(\?v=[^"]*)?"/g, 'src="js/appwrite-db.min.js?v=3.0"');
            html = html.replace(/src="js\/main.js(\?v=[^"]*)?"/g, 'src="js/main.min.js?v=3.0"');
            html = html.replace(/src="js\/manasek.js(\?v=[^"]*)?"/g, 'src="js/manasek.min.js?v=3.0"');
            html = html.replace(/src="js\/login.js(\?v=[^"]*)?"/g, 'src="js/login.min.js?v=3.0"');
            html = html.replace(/src="js\/admin.js(\?v=[^"]*)?"/g, 'src="js/admin.min.js?v=3.0"');
            html = html.replace(/src="js\/whatsapp-chat.js(\?v=[^"]*)?"/g, 'src="js/whatsapp-chat.min.js?v=3.0"');

            // Replace image tags to use optimized WebP and sizes/srcset
            // Navbar Logo
            html = html.replace(
                /<img src="images\/logo.png" alt="شعار الاتحاد" class="logo-img" width="52" height="44">/g,
                `<img src="images/logo-navbar.webp" alt="شعار الاتحاد" class="logo-img" width="52" height="44">`
            );

            // Hero section image
            html = html.replace(
                /<img src="images\/1.webp" alt="الحرم المكي الشريف" class="hero-image-responsive" width="1280" height="720">/g,
                `<img src="images/hero.webp" srcset="images/hero-480.webp 480w, images/hero-800.webp 800w, images/hero.webp 1280w" sizes="(max-width: 768px) 100vw, 1280px" alt="الحرم المكي الشريف" class="hero-image-responsive" width="1280" height="696">`
            );

            // Kaaba icon (Feature 1)
            html = html.replace(
                /<img src="images\/kaaba-icon.jpg" alt="خدمات متميزة" class="feature-image" loading="lazy" width="300" height="300">/g,
                `<img src="images/kaaba-icon.webp" alt="خدمات متميزة" class="feature-image" loading="lazy" width="300" height="300">`
            );

            // Bus image (Feature 2)
            html = html.replace(
                /<img src="images\/bus.jpg" alt="باصات حديثة" class="feature-image" loading="lazy" width="300" height="300">/g,
                `<img src="images/bus.webp" alt="باصات حديثة" class="feature-image" loading="lazy" width="300" height="261">`
            );

            // Cash image (Feature 3)
            html = html.replace(
                /<img src="images\/cash.jpg" alt="أفضل الأسعار" class="feature-image" loading="lazy" width="300" height="300">/g,
                `<img src="images/cash.webp" alt="أفضل الأسعار" class="feature-image" loading="lazy" width="300" height="327">`
            );

            // Clock image (Feature 4)
            html = html.replace(
                /<img src="images\/clock-icon.jpg" alt="التزام بالمواعيد" class="feature-image" loading="lazy" width="300" height="300">/g,
                `<img src="images/clock-icon.webp" alt="التزام بالمواعيد" class="feature-image" loading="lazy" width="300" height="300">`
            );

            // Kaaba image (Support section)
            html = html.replace(
                /<img src="images\/kaaba.jpg" alt="الكعبة" class="support-image" loading="lazy" width="640" height="720">/g,
                `<img src="images/kaaba.webp" srcset="images/kaaba-420.webp 420w, images/kaaba-840.webp 640w" sizes="(max-width: 768px) 100vw, 420px" alt="الكعبة" class="support-image" loading="lazy" width="420" height="472">`
            );

            // Guide image (Manasek page)
            html = html.replace(
                /<img src="images\/2.webp" alt="دليل مناسك العمرة" class="guide-img-responsive" loading="lazy" width="800" height="600">/g,
                `<img src="images/guide.webp" srcset="images/guide-400.webp 400w, images/guide-800.webp 800w" sizes="(max-width: 768px) 100vw, 800px" alt="دليل مناسك العمرة" class="guide-img-responsive" loading="lazy" width="800" height="537">`
            );

            // Minify HTML programmatically
            console.log(`Minifying HTML: ${file}...`);
            const minifiedHtml = await minifyHTML(html, {
                collapseWhitespace: true,
                removeComments: true,
                minifyCSS: true,
                minifyJS: true
            });
            fs.writeFileSync(path.join(rootDir, file), minifiedHtml, 'utf-8');
            console.log(`Successfully optimized and minified: ${file}`);
        }

        console.log('Build completed successfully!');
    } catch (e) {
        console.error('Build execution failed:', e);
        process.exit(1);
    }
})();
