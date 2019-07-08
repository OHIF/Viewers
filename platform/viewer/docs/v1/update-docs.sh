rm -rf _book
gitbook install
gitbook build
cp assets/CNAME _book/CNAME
cd _book
git init
git add -A
git commit -m 'Update compiled GitBook (this commit is automatic)'
git push -f git@github.com:OHIF/Viewers.git master:gh-pages
