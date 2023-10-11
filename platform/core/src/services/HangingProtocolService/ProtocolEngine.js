import { HPMatcher } from './HPMatcher.js';
import { sortByScore } from './lib/sortByScore';

export default class ProtocolEngine {
  constructor(protocols, customAttributeRetrievalCallbacks) {
    this.protocols = protocols;
    this.customAttributeRetrievalCallbacks = customAttributeRetrievalCallbacks;
    this.matchedProtocols = new Map();
    this.matchedProtocolScores = {};
    this.study = undefined;
  }

  /** Evaluate the hanging protocol matches on the given:
   * @param props.studies is a list of studies to compare against (for priors evaluation)
   * @param props.activeStudy is the current metadata for the study to display.
   * @param props.displaySets are the list of display sets which can be modified.
   */
  run({ studies, displaySets, activeStudy }) {
    this.studies = studies;
    this.study = activeStudy || studies[0];
    this.displaySets = displaySets;
    return this.getBestProtocolMatch();
  }

  // /**
  // * Resets the ProtocolEngine to the best match
  // */
  // reset() {
  //   const protocol = this.getBestProtocolMatch();

  //   this.setHangingProtocol(protocol);
  // }

  /**
   * Return the best matched Protocol to the current study or set of studies
   * @returns {*}
   */
  getBestProtocolMatch() {
    // Run the matching to populate matchedProtocols Set and Map
    this.updateProtocolMatches();

    // Retrieve the highest scoring Protocol
    const bestMatch = this._getHighestScoringProtocol();

    console.log('ProtocolEngine::getBestProtocolMatch bestMatch', bestMatch);

    return bestMatch;
  }

  /**
   * Populates the MatchedProtocols Collection by running the matching procedure
   */
  updateProtocolMatches() {
    console.log('ProtocolEngine::updateProtocolMatches');

    // Clear all data currently in matchedProtocols
    this._clearMatchedProtocols();

    // TODO: handle more than one study - this.studies has the list of studies
    const matched = this.findMatchByStudy(this.study, {
      studies: this.studies,
      displaySets: this.displaySets,
    });

    // For each matched protocol, check if it is already in MatchedProtocols
    matched.forEach(matchedDetail => {
      const protocol = matchedDetail.protocol;
      if (!protocol) {
        return;
      }

      // If it is not already in the MatchedProtocols Collection, insert it with its score
      if (!this.matchedProtocols.has(protocol.id)) {
        console.log(
          'ProtocolEngine::updateProtocolMatches inserting protocol match',
          matchedDetail
        );
        this.matchedProtocols.set(protocol.id, protocol);
        this.matchedProtocolScores[protocol.id] = matchedDetail.score;
      }
    });
  }

  /**
   * finds the match results against the given display set or
   * study instance by testing the given rules against this, and using
   * the provided options for testing.
   *
   * @param {*} metaData to match against as primary value
   * @param {*} rules to apply
   * @param {*} options are additional values that can be used for matching
   * @returns
   */
  findMatch(metaData, rules, options) {
    return HPMatcher.match(metaData, rules, this.customAttributeRetrievalCallbacks, options);
  }

  /**
   * Finds the best protocols from Protocol Store, matching each protocol matching rules
   * with the given study. The best protocol are ordered by score and returned in an array
   * @param  {Object} study StudyMetadata instance object
   * @param {object} options containing additional matching data.
   * @return {Array}       Array of match objects or an empty array if no match was found
   *                       Each match object has the score of the matching and the matched
   *                       protocol
   */
  findMatchByStudy(study, options) {
    const matched = [];

    this.protocols.forEach(protocol => {
      // Clone the protocol's protocolMatchingRules array
      // We clone it so that we don't accidentally add the
      // numberOfPriorsReferenced rule to the Protocol itself.
      let rules = protocol.protocolMatchingRules.slice();
      if (!rules || !rules.length) {
        console.warn(
          'ProtocolEngine::findMatchByStudy no matching rules - specify protocolMatchingRules for',
          protocol.id
        );
        return;
      }

      // Run the matcher and get matching details
      const matchedDetails = this.findMatch(study, rules, options);
      const score = matchedDetails.score;

      // The protocol matched some rule, add it to the matched list
      if (score > 0) {
        matched.push({
          score,
          protocol,
        });
      }
    });

    // If no matches were found, select the default protocol if provided
    // if not select the first protocol in the list
    if (!matched.length) {
      const protocol =
        this.protocols.find(protocol => protocol.id === 'default') ?? this.protocols[0];
      console.log('No protocol matches, defaulting to', protocol);
      return [
        {
          score: 0,
          protocol,
        },
      ];
    }

    // Sort the matched list by score
    sortByScore(matched);

    console.log('ProtocolEngine::findMatchByStudy matched', matched);

    return matched;
  }

  _clearMatchedProtocols() {
    this.matchedProtocols.clear();
    this.matchedProtocolScores = {};
  }

  _largestKeyByValue(obj) {
    return Object.keys(obj).reduce((a, b) => (obj[a] > obj[b] ? a : b));
  }

  _getHighestScoringProtocol() {
    if (!Object.keys(this.matchedProtocolScores).length) {
      return;
    }
    const highestScoringProtocolId = this._largestKeyByValue(this.matchedProtocolScores);
    return this.matchedProtocols.get(highestScoringProtocolId);
  }
}
