DICOMHP.imageSet = function(setNumber, category) {
    this.setNumber = setNumber;
    this.category = category;
};

DICOMHP.imageSet.prototype.setRelativeTime = function(time) {
    this.relativeTime = time;
};

DICOMHP.imageSet.prototype.setTimeUnits = function(units) {
    this.timeUnits = units;
};

DICOMHP.imageSet.prototype.setPriorValue = function(priorValue) {
    this.priorValue = priorValue;
};

DICOMHP.imageSet.prototype.retrieve = function(studyInstanceId) {

};
