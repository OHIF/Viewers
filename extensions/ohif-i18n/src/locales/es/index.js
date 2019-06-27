import Buttons from './Buttons.json';
import CineDialog from './CineDialog.json';
import Common from './Common.json';
import Header from './Header.json';
import MeasurementTable from './MeasurementTable.json';
import UserPreferencesModal from './UserPreferencesModal.json';

/** Sublanguages */
import es_AR from './AR';
import es_MX from './MX';

export default {
  es: {
    Buttons,
    CineDialog,
    Common,
    Header,
    MeasurementTable,
    UserPreferencesModal,
  },
  ...es_AR,
  ...es_MX,
};
