
OrthancRemote.prototype.findStudies = function(modality, params) {
  return this.query(modality, 'Study', params);
}

OrthancRemote.prototype.findSeries = function(modality, studyId, params) {
  params = Object.assign({StudyInstanceUID : studyId || ''}, params);

  return this.query(modality, 'Series', params);
}

OrthancRemote.prototype.findInstances = function(modality, studyId, seriesId, params) {
  params = Object.assign({StudyInstanceUID : studyId || '', SeriesInstanceUID : seriesId || ''}, params);

  return this.query(modality, 'Instance', params);
}

OrthancRemote.prototype.query = function(modality, level, params) {
  var url = this.root + '/modalities/' + modality + '/query',
      postData = {Level : level, Query : params || {}};
  
  var result = HTTP.call('POST', url, {content : JSON.stringify(postData)});
  return this.getAnswersFromQuery(result.data['ID']);
}

OrthancRemote.prototype.getAnswersFromQuery = function(id) {
  var url = this.root + '/queries/' + id + '/answers',
      result = HTTP.call('GET', url);

  var resultCount = result.data.length, answers = [], i = 0;
  while (i < resultCount) {
    var contentUrl = this.root + '/queries/' + id + '/answers/' + result.data[i] + '/content';
    //fetch the result
    var contentResult = HTTP.call('GET', contentUrl);
    answers.push(contentResult.data); 
    i++;
  }
  return {
    query : id,
    length : resultCount,
    results : answers
  };
}

OrthancRemote.prototype.retrieveAnswer = function(query, index) {
  var retrieveUrl = this.root + '/queries/' + query + '/answers/' + index + '/retrieve';

  var result = HTTP.call('POST', retrieveUrl, {content : this.localAE});

  return result.data;
}

OrthancRemote.prototype.retrieveStudy = function(modality, studyInstanceUID) {
  var id = this.findStudyID(studyInstanceUID);
  if (id === null) {
    //retrieve the study
    console.log('RetrieveStudy', studyInstanceUID);
    var result = this.findStudies(modality, {"StudyInstanceUID" : studyInstanceUID});
    if (result.results.length < 1) {
      throw new Meteor.Error(404, "No such study");
    }

    this.retrieveAnswer(result.query, 0);
    //check again
    id = this.findStudyID(studyInstanceUID);
    if (id === null) {
      throw new Meteor.Error(500, "Failed to retrieve remote study");
    }
  }
  return id;
}

OrthancRemote.prototype.retrieveMetadata = function(modality, studyInstanceUID) {
  var studyId = this.retrieveStudy(modality, studyInstanceUID),
      instances = this.getInstancesByStudy(studyId);

  var results = [], length = instances.length;
  for (var i = 0;i < length;i++) {
    var instanceId = instances[i].ID, metadata = this.getInstanceMetadata(instanceId);
    metadata['xxxx,0001'] = {Value : instanceId};
    
    results.push(metadata);
  }

  return results;
}

OrthancRemote.prototype.getInstancesByStudy = function(studyId) {
  var url = this.root + '/studies/' + studyId + '/instances';

  var result = this._getCall(url);
  return result;
}

OrthancRemote.prototype.getInstanceMetadata = function(instanceId) {
  var url = this.root + '/instances/' + instanceId + '/tags';

  return this._getCall(url);
}

OrthancRemote.prototype.findStudyID = function(uid) {
  var url = this.root + '/tools/lookup';

  var result = HTTP.call('POST', url, {content : uid}), len = result.data.length;
  for (var i = 0;i < len;i++) {
    if (result.data[i].Type == 'Study') {
      return result.data[i].ID;
    }
  }
  return null;
}

OrthancRemote.prototype._getCall = function(url) {
  return HTTP.call('GET', url).data;
}