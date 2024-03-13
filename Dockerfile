FROM  registry.access.redhat.com/ubi9/nodejs-18 AS build

USER root
RUN command -v yarn || npm i -g yarn

ADD . /usr/src/app/skupper_console
WORKDIR /usr/src/app/skupper_console
RUN yarn install --network-timeout 7200000 && yarn build

FROM registry.access.redhat.com/ubi9/nginx-122:1-45

# Add application sources to a directory that the assemble script expects them
# and set permissions so that the container runs without root access
USER 0

COPY --from=build /usr/src/app//skupper_console/dist /usr/share/nginx/html/
# add locales
ADD ./locales /usr/share/nginx/html/locales
RUN chown -R 1001:0 /usr/share/nginx/html/
RUN rm -rf ./*

ARG VERSION_PLUGIN
ARG COMMIT_HASH
RUN printf "\necho 'OpenShift Service Interconnect Console: Version=[${VERSION_PLUGIN}], Commit=[${COMMIT_HASH}]' >> /proc/1/fd/1" >> ${NGINX_CONTAINER_SCRIPTS_PATH}/common.sh

USER 1001
LABEL com.redhat.component="openshift-service-interconnect-console" \
  name="openshift-service-interconnect-console" \
  summary="OpenShift Service interconnect Console" \
  description="The OpenShift Service interconnect Console adds configuration and validation into the OpenShift Console." \
  version=$VERSION_PLUGIN \
  commit=$COMMIT_HASH

# Run script uses standard ways to run the application
CMD /usr/libexec/s2i/run
