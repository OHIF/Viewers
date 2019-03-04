cd docs
yarn -v
node -v
echo 'Installing Gitbook CLI'
yarn global add gitbook-cli

echo 'Running Gitbook installation'

# Generate all version's GitBook output
for D in *; do
    if [ -d "${D}" ]; then
        echo "Generating output for: ${D}"
		cd "${D}"

		# Clear previous output, generate new
		rm -rf _book
		gitbook install
		gitbook build

		cd ..
    fi
done

# Move CNAME File into `latest`
cp CNAME ./latest/CNAME

# Create a history folder in our latest version's output
mkdir ./latest/_book/history

# Move each version's files to latest's history folder
for D in *; do
	if [ -d "${D}" ]; then
		if [[ "${D}" == v* ]] ; then
    		echo "Moving ${D} to the latest version's history folder"

			mkdir "./latest/_book/history/${D}"
			mv -v "./${D}/_book"/* "./latest/_book/history/${D}"
		fi
	fi
done
cd ..

# Build and copy the StandaloneViewer into the static directory
echo $DEPLOY_PRIME_URL
cd Packages-react/ohif-viewer
export ROOT_URL=$DEPLOY_PRIME_URL/demo

cat package.json
yarn install
yarn build

cd example
yarn install
yarn run prepare
sed -i "s,http://localhost:5000,${ROOT_URL},g" index.html
sed -i 's,"routerBasename": "/","routerBasename": "/demo",g' index.html
rm -rf node_modules
mkdir ../../../docs/latest/_book/demo/
cp -R * ../../../docs/latest/_book/demo/
cp ../../../_redirects ../../../docs/latest/_book/_redirects
