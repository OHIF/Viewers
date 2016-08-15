Template.registerHelper('getTimepointName', timepoint => {
	const instance = Template.instance()
	const timepointApi = instance.data.timepointApi;
	return timepointApi.name(timepoint);
});