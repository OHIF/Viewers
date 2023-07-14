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
   * @param props.nthBest is the nth best match from the existing options. In case of undefined it consider the first best.
   */
  run({ studies, displaySets, activeStudy, nthBest }) {
    this.studies = studies;
    this.study = activeStudy || studies[0];
    this.displaySets = displaySets;
    return this.getBestProtocolMatch(nthBest);
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
   * @param nthBest is the nth best match from the existing options. In case of undefined it consider the first best.
   * @returns {*}
   */
  getBestProtocolMatch(nthBest) {

    if(!nthBest) {
      // Run the matching to populate matchedProtocols Set and Map
      this.updateProtocolMatches();
    }

    // Retrieve the highest scoring Protocol
    const bestMatch = this._getHighestScoringProtocol(nthBest);

    console.log('ProtocolEngine::getBestProtocolMatch bestMatch', bestMatch);

    return bestMatch;
  }

  /**
   * Returns the amount of matched protocols
   *
   * @returns number
   */
  getMatchedProtocolsSize() {
    return this.matchedProtocols.size;
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
    return HPMatcher.match(
      metaData,
      rules,
      this.customAttributeRetrievalCallbacks,
      options
    );
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
        this.protocols.find(protocol => protocol.id === 'default') ??
        this.protocols[0];
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

  _largestKeyByValue(obj, nth = 1) {
    const sortedObj = Object.keys(obj).sort((a, b) => (obj[a] > obj[b]));

    return sortedObj[nth - 1];
  }

  /**
   * Get the protocol with highest score.
   * If nth is present return the nth best match.
   * @param nth tells that we need the nth highest scoring protocol. Default if 1 (first).
   *
   */
  _getHighestScoringProtocol(nth) {
    if (!Object.keys(this.matchedProtocolScores).length) {
      return;
    }
    const highestScoringProtocolId = this._largestKeyByValue(
      this.matchedProtocolScores,
      nth
    );
    return this.matchedProtocols.get(highestScoringProtocolId);
  }
}
