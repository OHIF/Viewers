// Default Configuration to handle Metadata from WADO or DIMSE,
// currently retrieved through Meteor server
let configuration = {
	// These are examples, they need to actually check the properties of the Objects
	getSeries: (study, seriesNumOrUid) => {
		// Use Array to find the appropriate Series
		return study.seriesList.find(series => series['seriesNumber'] === value);
	},

	getInstance: (series, instanceNumOrUid) => {
		return series.instances.find(instance => instance['instanceNumber'] === instanceNumOrUid)
	}

	getInstanceTagRaw: (instance, tag) => {
		// (this won't actually work yet)
		return instance[tag];
	}

	getInstanceTagNum: (instance, tag) => {
		// (this won't actually work yet)
		return parseFloat(instance[tag]);
	}
};

// Example Nucleus configuration
// 
configuration = {
	getSeries: (study, seriesNumOrUid) => study.studyView.series(seriesNumOrInstanceUid),
	getInstance: (series, instanceNumOrUid) => series.seriesView.instance(instanceNumOrUid),
	getInstanceTagRaw: (instance, tag) => instance.instanceView.raw(tag),
	getInstanceTagNum: (instance, tag) => instance.instanceView.num(tag),
	getCustom(instance, custom) => instance.instanceView[custom]
}

class StudyMetadataView {
	series(tag, value) {
		// Retrieves Series by Series Number or SeriesInstanceUid
		return configuration.getSeries(study, tag, value);
	}
}

class SeriesMetadataView {
	instances(tag, value) {
		// Retrieves Instances by Instances Number or SOPInstanceUid
		return configuration.getInstance(series, tag, value);
	}
}

class InstanceMetadataView {
	/* Retrieves raw value of tag from instance */
	raw(tag) {
		return configuration.getInstanceTagRaw(instance, tag);
	}

	/* Retrieves raw value of tag from instance */
	num(tag) {
		return configuration.getInstanceTagNum(instance, tag);
	}

	custom(custom) {
		return configuration.getCustom(instance, custom)
	}
	// etc.. Date, DateTime, ...? Sequence...
}