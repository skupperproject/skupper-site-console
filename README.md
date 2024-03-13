# Red Hat Service Interconnect OpenShift Console Plugin Guide

**Status: Working in progress**

This plugin for Openshift installs a tab in **Projects** -> **< project name >** to create a Skupper network. The purpose of this plugin is purely educational to get familiar with Skupper commands.

## Installing the Dynamic Plugin in Openshift

To install the dynamic plugin, follow these steps:

- **Authenticate with your cluster:**, then run the following command in the directory containing your `manifest.json` file.

  ```shell
  oc apply -f manifest.json
  ```

  or

  ```shell
  kubectl apply -f manifest.json
  ```

- **Enable the plugin directly from the Openshift console**: Go to the OpenShift console and enable the plugin from there.

## Dynamic Plugin development

- **Install the modules:**

  ```shell
  yarn install
  ```


- **Start the development server:** Open a terminal and run:

  ```shell
  yarn start
  ```

- **Launch the console development environment:** Open another terminal window and execute:

  ```shell
  yarn start-console
  ```

- **Access the plugin:** Open your browser and go to localhost:9000. You will find the "Service Interconnect" tab under "Project" -> 'name of your Project'.
