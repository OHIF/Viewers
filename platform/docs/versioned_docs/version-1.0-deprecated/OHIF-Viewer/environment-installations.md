---
title: Development Environment Installation
---

**Development Environment Installation (Ubuntu)**

**CONFIDENTIAL DOCUMENT**

This is a confidential document and property of Radical Imaging LLC. It shall not be transmitted, copied or sent to anyone without prior authorization.

**Index**

[[TOC]]

<table>
<tr>
<td>Acronyms and definitions</td>
<td></td>
</tr>
<tr>
<td>Acronym/Definition</td>
<td>Meaning</td>
</tr>
<tr>
<td>N/A</td>
<td>N/A</td>
</tr>
</table>


<table>
<tr>
<td>Referenced Documents</td>
<td></td>
</tr>
<tr>
<td>Doc No</td>
<td>Doc Title</td>
</tr>
<tr>
<td>DOC00001</td>
<td>Radical Imaging Official Documents Template</td>
</tr>
</table>


# PURPOSE AND OBJECTIVES

The purpose of this document is to describe the development environment installation of OHIF viewer/Lesion Tracker on Linux Ubuntu.

# DEVELOPMENT ENVIRONMENT INSTALLATION

## Docker

Docker is an open source software platform to create, deploy and manage virtualized application containers on common operating systems, with several allied tools.

To install Docker, follow the instructions below:

1. Open a terminal, and update the apt package index, by running the following command:

sudo apt-get update

Expected result:

<!-- ![image alt text](image_0.png) -->

2. Install packages to allow apt to use a repository over HTTPS, by running the following command:

sudo apt-get install apt-transport-https ca-certificates curl software-properties-common

Expected result:

<!-- ![image alt text](image_1.png) -->

3. Add Docker’s official GPG key, by running the following command:

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

Expected result:

<!-- ![image alt text](image_2.png) -->

4. Verify that you now have the key with the fingerprint **9DC8 5822 9FC7 DD38 854A E2D8 8D81 803C 0EBF CD88**, by searching for the last 8 characters of the fingerprint after running the following command:

sudo apt-key fingerprint 0EBFCD88

Expected result:

<!-- ![image alt text](image_3.png) -->

5. Use the following command to set up the stable repository.

sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

Expected result:

<!-- ![image alt text](image_4.png) -->

6. Install the latest version of Docker CE, by running the following command:

sudo apt-get install docker-ce

Expected result:

<!-- ![image alt text](image_5.png) -->

7. Verify that Docker CE is installed correctly by running the hello-world image:

sudo docker run hello-world

Expected result:

<!-- ![image alt text](image_6.png) -->

**Note**: Additional information about Docker installation on Linux Ubuntu OS can be foud at [https://docs.docker.com/install/linux/docker-ce/ubuntu/](https://docs.docker.com/install/linux/docker-ce/ubuntu/).

## DCM4CHE

Dcm4che ([https://www.dcm4che.org/](https://www.dcm4che.org/)) is a collection of open source applications and utilities for healthcare.

To install Dcm4che, follow the instructions below:

1. Before start, you need to create the following folders on your *Home *directory:

* DCM4CHEE

* dcm4chee-arc

* db

* ldap

* slapd.d

* storage

* wildfly



2. Create the following files on the DCM4CHEE folder, with the correspondent contents:

docker-compose.env

```
STORAGE_DIR=/storage/fs1
POSTGRES_DB=pacsdb
POSTGRES_USER=pacs
POSTGRES_PASSWORD=pacs
```


docker-compose.yml

```
version: "3"
services:
ldap:
image: dcm4che/slapd-dcm4chee:2.4.44-14.1
logging:
driver: json-file
options:
max-size: "10m"
ports:
- "389:389"
env_file: docker-compose.env
volumes:
- /etc/localtime:/etc/localtime:ro
- /etc/timezone:/etc/timezone:ro
- ~/dcm4chee-arc/ldap:/var/lib/ldap
- ~/dcm4chee-arc/slapd.d:/etc/ldap/slapd.d
db:
image: dcm4che/postgres-dcm4chee:10.4-14
logging:
driver: json-file
options:
max-size: "10m"
ports:
- "5432:5432"
env_file: docker-compose.env
volumes:
- /etc/localtime:/etc/localtime:ro
- /etc/timezone:/etc/timezone:ro
- ~/dcm4chee-arc/db:/var/lib/postgresql/data
arc:
image: dcm4che/dcm4chee-arc-psql:5.14.1
logging:
driver: json-file
options:
max-size: "10m"
ports:
- "8080:8080"
- "8443:8443"
- "9990:9990"
- "11112:11112"
- "2575:2575"
env_file: docker-compose.env
environment:
WILDFLY_CHOWN: /opt/wildfly/standalone /storage
WILDFLY_WAIT_FOR: ldap:389 db:5432
depends_on:
- ldap
- db
volumes:
- /etc/localtime:/etc/localtime:ro
- /etc/timezone:/etc/timezone:ro
- ~/dcm4chee-arc/wildfly:/opt/wildfly/standalone
- ~/dcm4chee-arc/storage:/storage</td>
```

Files/Folder will become like the image above:

<!-- ![image alt text](image_7.png) -->

1. Open a terminal inside DCM4CHE folder, and run the following command:

sudo snap install docker

Expected result:

<!-- ![image alt text](image_8.png) -->

4. Still inside the DCM4CHE folder, run the following command:

sudo docker-compose -p dcm4chee up -d

Expected result:

<!-- ![image alt text](image_9.png) -->

1. The following commands can be used to control DCM4CHE:

Stop all 3 containers: docker-compose -p dcm4chee stop

Start all 3 containers again: docker-compose -p dcm4chee start

Stop and delete all 3 containers: docker-compose -p dcm4chee down

2. Now it is necessary to import some DICOM studies to DCM4CHE. Before importing these studies, you will need to download them. To do so, access the address [http://34.224.187.57:3000/studylist](http://34.224.187.57:3000/studylist), right click one or more studies, and select the option Export:

<!-- ![image alt text](image_10.png) -->

3. Confirm the study export on the modal window that will appear:

<!-- ![image alt text](image_11.png) -->

4. The study(ies) export will begin. You can follow the exporting progress:

<!-- ![image alt text](image_12.png) -->

5. After the exporting progress, the study(ies) will be downloaded in a file called "studies.zip". Create a folder named “Studies” on your Home folder, and extract this and any other studies you download in this folder:

<!-- ![image alt text](image_13.png) -->

6. Open the terminal, go to the DCM4CHE folder, and run the following command in order to send the studies to DCM4CHE:

docker run -v ~/Studies/:/tmp --rm --network=dcm4chee_default dcm4che/dcm4che-tools:5.14.0 storescu -cDCM4CHEE@arc:11112 /tmp

Expected result:

<!-- ![image alt text](image_14.png) -->

7. Now, go to your browser and access the URL [http://localhost:8080/dcm4chee-arc/ui2/](http://localhost:8080/dcm4chee-arc/ui2/). Once opened, click on the refresh icon on the most right:

<!-- ![image alt text](image_15.png) -->

8. The studies received by DCM4CHE will be shown:

<!-- ![image alt text](image_16.png) -->

9. Open the terminal, go to your Home folder, and run the following command in order to clone viewers repository to your local:

git clone https://github.com/OHIF/Viewers.git

Expected result:

<!-- ![image alt text](image_17.png) -->

10. Then, enter the Viewers folder, and run the following command in order to make sure that you are in master branch:

git checkout master

Expected result:

<!-- ![image alt text](image_18.png) -->

11. Now go to OHIFViewer folder and run the following command:

meteor npm install

Expected result:

<!-- ![image alt text](image_19.png) -->

12. Still on the OHIFViewer folder, run the following command:

./bin/dcm4cheeDICOMWeb.sh

Expected result:

<!-- ![image alt text](image_20.png) -->

13. Now, go to your browser and access the URL [http://localhost:3000](http://localhost:3000). Once opened, change the Study Date filter to start on the year 2000:

<!-- ![image alt text](image_21.png) -->

14. The imported studies will be show. Double click a study to open it:

<!-- ![image alt text](image_22.png) -->

## Meteor

Meteor is a JavaScript web framework that allows for rapid prototyping and produces cross-platform code.

To install Meteor, follow the instructions below:

**_Remark_***: This guide covers the Linux Ubuntu version. Installation instructions can be different on other operating systems.*

1. Open a terminal, and run the following command:

curl https://install.meteor.com/ | sh

Expected result:

<!-- ![image alt text](image_23.png) -->

## Starting OHIF Viewer after system restart

These are the steps to run OHIFVIewer after system restart:.

1. Open terminal

2. Access the DCM4CHEE folder, on your Home folder

3. Run the following command in order to start docker containers:

docker-compose -p dcm4chee start

4. Access the Viewers/OHIFViewer folder, on your Home folder

5. Run the following command in order to run OHIF Viewer:

./bin/dcm4cheeDICOMWeb.sh

6. Access the address [http://localhost:3000](http://localhost:3000)
