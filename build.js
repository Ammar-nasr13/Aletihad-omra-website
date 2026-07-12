const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;
const srcDir = path.join(rootDir, 'src');

console.log('Starting optimization build script...');

// Helper to create directories
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// 1. Backup original files to src/
console.log('Backing up original source files to src/...');
ensureDir(srcDir);
ensureDir(path.join(srcDir, 'css'));
ensureDir(path.join(srcDir, 'js'));

const htmlFiles = ['index.html', 'programs.html', 'manasek.html', 'login.html', 'admin.html', '404.html', 'program-manasik.html', 'program-tawaf.html', 'program-maqam.html', 'program-siyaha.html'];
const jsFiles = ['main.js', 'manasek.js', 'login.js', 'admin.js', 'appwrite-db.js', 'whatsapp-chat.js'];

// Backup HTML files if not already backed up
htmlFiles.forEach(file => {
    const srcPath = path.join(rootDir, file);
    const destPath = path.join(srcDir, file);
    if (fs.existsSync(srcPath) && !fs.existsSync(destPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`Backed up: ${file}`);
    }
});

// Backup CSS
if (fs.existsSync(path.join(rootDir, 'css', 'styles.css')) && !fs.existsSync(path.join(srcDir, 'css', 'styles.css'))) {
    fs.copyFileSync(path.join(rootDir, 'css', 'styles.css'), path.join(srcDir, 'css', 'styles.css'));
    console.log('Backed up: css/styles.css');
}

// Backup JS
jsFiles.forEach(file => {
    const srcPath = path.join(rootDir, 'js', file);
    const destPath = path.join(srcDir, 'js', file);
    if (fs.existsSync(srcPath) && !fs.existsSync(destPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`Backed up: js/${file}`);
    }
});

// 2. Minify CSS
console.log('Minifying CSS...');
try {
    execSync(`npx clean-css-cli -o "${path.join(rootDir, 'css', 'styles.min.css')}" "${path.join(srcDir, 'css', 'styles.css')}"`, { stdio: 'inherit' });
    console.log('Successfully minified css/styles.css -> css/styles.min.css');
} catch (e) {
    console.error('Error minifying CSS:', e);
}

// 3. Minify JS
console.log('Minifying JS files...');
jsFiles.forEach(file => {
    try {
        const srcPath = path.join(srcDir, 'js', file);
        const destPath = path.join(rootDir, 'js', file.replace('.js', '.min.js'));
        execSync(`npx terser "${srcPath}" --compress --mangle -o "${destPath}"`, { stdio: 'inherit' });
        console.log(`Successfully minified js/${file} -> js/${file.replace('.js', '.min.js')}`);
    } catch (e) {
        console.error(`Error minifying js/${file}:`, e);
    }
});

// 4. Critical CSS extraction
// We take lines 1 to 468 of styles.css (reset, root, typography, navbar, hero) as critical CSS
const fullCss = fs.readFileSync(path.join(srcDir, 'css', 'styles.css'), 'utf-8');
const lines = fullCss.split('\n');
const criticalCssRaw = lines.slice(0, 468).join('\n');

// Minify critical CSS using clean-css programmatically
const tempCritFile = path.join(rootDir, 'temp-crit.css');
const tempCritMinFile = path.join(rootDir, 'temp-crit.min.css');
fs.writeFileSync(tempCritFile, criticalCssRaw, 'utf-8');
execSync(`npx clean-css-cli -o "${tempCritMinFile}" "${tempCritFile}"`);
const criticalCssMin = fs.readFileSync(tempCritMinFile, 'utf-8');
fs.unlinkSync(tempCritFile);
fs.unlinkSync(tempCritMinFile);

console.log('Generated and minified Critical CSS.');

// Local Font CSS definition
const localFontCss = fs.readFileSync(path.join(rootDir, 'fonts', 'fonts.css'), 'utf-8');
const tempFontMinFile = path.join(rootDir, 'temp-font.min.css');
const tempFontFile = path.join(rootDir, 'temp-font.css');
fs.writeFileSync(tempFontFile, localFontCss, 'utf-8');
execSync(`npx clean-css-cli -o "${tempFontMinFile}" "${tempFontFile}"`);
const fontsCssMin = fs.readFileSync(tempFontMinFile, 'utf-8');
fs.unlinkSync(tempFontFile);
fs.unlinkSync(tempFontMinFile);

// Save fonts minified CSS
fs.writeFileSync(path.join(rootDir, 'css', 'fonts.min.css'), fontsCssMin, 'utf-8');
console.log('Generated css/fonts.min.css');

// 5. Process HTML files
console.log('Processing HTML files (Inlining CSS, preloads, WebP images, JS updates)...');

htmlFiles.forEach(file => {
    let html = fs.readFileSync(path.join(srcDir, file), 'utf-8');
    
    // Replace Google Fonts links with minified local fonts.css
    const googleFontsPattern = /<!-- Fonts & Icons -->[\s\S]*?<link href="https:\/\/fonts.googleapis.com\/css2\?family=Almarai[\s\S]*?" rel="stylesheet">/g;
    const fontReplacer = `<!-- Self-Hosted local fonts -->\n    <link rel="stylesheet" href="css/fonts.min.css">`;
    html = html.replace(googleFontsPattern, fontReplacer);

    // Preload critical fonts Cairo Bold/Regular and Navbar logo
    const headInsertPattern = /<\/head>/;
    const preloads = `    <!-- Core Web Vitals Preloads -->
    <link rel="preload" href="fonts/cairo-700.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="fonts/cairo-400.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="images/logo-navbar.webp" as="image" type="image/webp">
\n</head>`;
    html = html.replace(headInsertPattern, preloads);

    // Replace render-blocking styles.css with inlined Critical CSS and async styles.min.css loading
    const stylesCssPattern = /<link rel="stylesheet" href="css\/styles.css">/g;
    const asyncStyleReplacer = `<style id="critical-css">${criticalCssMin}</style>
    <link rel="stylesheet" href="css/styles.min.css" media="print" data-media="all" onload="this.media=this.dataset.media">
    <noscript><link rel="stylesheet" href="css/styles.min.css"></noscript>`;
    html = html.replace(stylesCssPattern, asyncStyleReplacer);

    // Replace script tags with .min.js and add versioning cache buster
    html = html.replace(/src="js\/appwrite-db.js(\?v=[^"]*)?"/g, 'src="js/appwrite-db.min.js?v=2.1"');
    html = html.replace(/src="js\/main.js(\?v=[^"]*)?"/g, 'src="js/main.min.js?v=2.1"');
    html = html.replace(/src="js\/manasek.js(\?v=[^"]*)?"/g, 'src="js/manasek.min.js?v=2.1"');
    html = html.replace(/src="js\/login.js(\?v=[^"]*)?"/g, 'src="js/login.min.js?v=2.1"');
    html = html.replace(/src="js\/admin.js(\?v=[^"]*)?"/g, 'src="js/admin.min.js?v=2.1"');
    html = html.replace(/src="js\/whatsapp-chat.js(\?v=[^"]*)?"/g, 'src="js/whatsapp-chat.min.js?v=2.1"');

    // Replace image tags to use optimized WebP and sizes/srcset
    // Navbar Logo
    html = html.replace(
        /<img src="images\/logo.png" alt="شعار الاتحاد" class="logo-img" width="52" height="44" \/>/g,
        `<img src="images/logo-navbar.webp" alt="شعار الاتحاد" class="logo-img" width="52" height="44" />`
    );
    html = html.replace(
        /<img src="images\/logo.png" alt="شعار الاتحاد" class="logo-img" width="52" height="44">/g,
        `<img src="images/logo-navbar.webp" alt="شعار الاتحاد" class="logo-img" width="52" height="44" />`
    );
    html = html.replace(
        /<img src="images\/logo.png" alt="شعار الاتحاد" class="login-logo-img" width="52" height="44">/g,
        `<img src="images/logo-navbar.webp" alt="شعار الاتحاد" class="login-logo-img" width="52" height="44" />`
    );
    html = html.replace(
        /<img src="images\/logo.png" alt="شعار الاتحاد" class="admin-header-logo" width="52" height="44">/g,
        `<img src="images/logo-navbar.webp" alt="شعار الاتحاد" class="admin-header-logo" width="52" height="44" />`
    );

    // Footer Logo
    html = html.replace(
        /<img src="images\/logo.png" alt="شعار الاتحاد" class="logo-img" loading="lazy" width="60" height="51" \/>/g,
        `<img src="images/logo-footer.webp" alt="شعار الاتحاد" class="logo-img" loading="lazy" width="60" height="51" />`
    );
    html = html.replace(
        /<img src="images\/logo.png" alt="شعار الاتحاد" class="logo-img" loading="lazy" width="60" height="51"\/>/g,
        `<img src="images/logo-footer.webp" alt="شعار الاتحاد" class="logo-img" loading="lazy" width="60" height="51" />`
    );

    // Bus image (Feature 1)
    html = html.replace(
        /<img src="images\/bus.jpeg" alt="أفخم الباصات" class="feature-image feature-image--wide" loading="lazy" width="640" height="720">/g,
        `<img src="images/bus.webp" srcset="images/bus-320.webp 320w, images/bus-540.webp 540w" sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 270px" alt="أفخم الباصات" class="feature-image feature-image--wide" loading="lazy" width="270" height="180">`
    );

    // Hotel image (Feature 2)
    html = html.replace(
        /<img src="images\/hotel.jpeg" alt="أفخم الفنادق" class="feature-image feature-image--wide" loading="lazy" width="640" height="720">/g,
        `<img src="images/hotel.webp" srcset="images/hotel.webp 270w, images/hotel-540.webp 540w" sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 270px" alt="أفخم الفنادق" class="feature-image feature-image--wide" loading="lazy" width="270" height="187">`
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

    // Save temporary HTML file
    const tempHtmlFile = path.join(rootDir, `temp-${file}`);
    fs.writeFileSync(tempHtmlFile, html, 'utf-8');

    // Minify HTML using html-minifier-terser
    try {
        console.log(`Minifying HTML: ${file}...`);
        execSync(`npx html-minifier-terser --collapse-whitespace --remove-comments --minify-css true --minify-js true -o "${path.join(rootDir, file)}" "${tempHtmlFile}"`);
        console.log(`Successfully optimized and minified: ${file}`);
    } catch (e) {
        console.error(`Error minifying ${file}:`, e);
    } finally {
        if (fs.existsSync(tempHtmlFile)) {
            fs.unlinkSync(tempHtmlFile);
        }
    }
});

console.log('Build completed successfully!');
