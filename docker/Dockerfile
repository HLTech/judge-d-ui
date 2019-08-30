FROM nginx

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY build /usr/share/nginx/html
COPY docker/config.js /usr/share/nginx/html
COPY docker/entrypoint.sh ./
RUN chmod +x entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx","-g","daemon off;"]