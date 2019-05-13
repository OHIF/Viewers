# Nginx + Image Archive

> DISCLAIMER! We make no claims or guarantees of this approach's security. If in
> doubt, enlist the help of an expert and conduct proper audits.

At a certain point, you may want others to have access to your instance of the
OHIF Viewer and its medical imaging data. This post covers one of many potential
setups that accomplish that. Please note, noticably absent is user account
control.

Do not use this recipe to host sensitive medical data on the open web. Depending
on your company's policies, this may be an appropriate setup on an internal
network when protected with a server's basic authentication. For a more robust
setup, check out our [user account control recpie](./user-account-control.md)
that builds on the lessons learned here.

## Overview
