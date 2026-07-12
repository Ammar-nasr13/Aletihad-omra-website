FROM nginx:alpine
# Copy minified production files and assets
COPY index.html programs.html manasek.html login.html admin.html 404.html sitemap.xml robots.txt /usr/share/nginx/html/
COPY program-manasik.html program-tawaf.html program-maqam.html program-siyaha.html /usr/share/nginx/html/
COPY css /usr/share/nginx/html/css
COPY js /usr/share/nginx/html/js
COPY fonts /usr/share/nginx/html/fonts
COPY images /usr/share/nginx/html/images
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
