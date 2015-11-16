docs:
	mkdir -p docs
	rm docs/* || true
	
	# Make jsdoc3 documentation
	jsdoc . -c conf.json -r -d docs -R README.md

	# Make docco documentation (not sure if we will keep this)
	mkdir -p docs/docco
	docco {Packages,Viewer,LesionTracker}/{**/*,*} -o docs/docco -l parallel

# Force rebuild even if the docs exist
.PHONY: docs
