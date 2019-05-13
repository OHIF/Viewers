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
cp CNAME ./latest/_book/CNAME

# Create a history folder in our latest version's output
mkdir ./latest/_book/history

# Move each version's files to latest's history folder
for D in *; do
	if [ -d "${D}" ]; then
		if [[ "${D}" == v* ]] ; then
    		echo "Moving ${D} to the latest version's history folder"

			mkdir "./latest/_book/history/${D}"
			mv -v "./${D}/_book"/**/* "./latest/_book/history/${D}"
		fi
	fi
done
cd ..

# Build and copy the StandaloneViewer into the static directory
echo $DEPLOY_PRIME_URL
export ROOT_URL=$DEPLOY_PRIME_URL/demo

mkdir ./docs/latest/_book/demo/
yarn install
yarn build:web:ci
