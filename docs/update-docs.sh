rm -rf _book
gitbook install
gitbook build
cp assets/CNAME _book/CNAME
cd _book
git init
git add -A
git commit -m 'update book'
git push -f git@github.com:OHIF/Viewers/.git master:gh-pages
