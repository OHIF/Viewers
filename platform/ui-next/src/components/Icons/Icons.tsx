import React from 'react';
import Actions from './Sources/Actions';
import Add from './Sources/Add';
import Cancel from './Sources/Cancel';
import ChevronClosed from './Sources/ChevronClosed';
import ChevronOpen from './Sources/ChevronOpen';
import Code from './Sources/Code';
import ColorChange from './Sources/ColorChange';
import Controls from './Sources/Controls';
import Delete from './Sources/Delete';
import DicomTagBrowser from './Sources/DicomTagBrowser';
import DisplayFillAndOutline from './Sources/DisplayFillAndOutline';
import DisplayFillOnly from './Sources/DisplayFillOnly';
import DisplayOutlineOnly from './Sources/DisplayOutlineOnly';
import Download from './Sources/Download';
import Export from './Sources/Export';
import EyeHidden from './Sources/EyeHidden';
import EyeVisible from './Sources/EyeVisible';
import GearSettings from './Sources/GearSettings';
import Hide from './Sources/Hide';
import IconMPR from './Sources/IconMPR';
import Info from './Sources/Info';
import InfoLink from './Sources/InfoLink';
import InfoSeries from './Sources/InfoSeries';
import ListView from './Sources/ListView';
import LoadingSpinner from './Sources/LoadingSpinner';
import Lock from './Sources/Lock';
import Minus from './Sources/Minus';
import MissingIcon from './Sources/MissingIcon';
import More from './Sources/More';
import MultiplePatients from './Sources/MultiplePatients';
import NavigationPanelReveal from './Sources/NavigationPanelReveal';
import OHIFLogo from './Sources/OHIFLogo';
import Patient from './Sources/Patient';
import Pin from './Sources/Pin';
import PinFill from './Sources/PinFill';
import Plus from './Sources/Plus';
import PowerOff from './Sources/PowerOff';
import Refresh from './Sources/Refresh';
import Rename from './Sources/Rename';
import Series from './Sources/Series';
import Settings from './Sources/Settings';
import Show from './Sources/Show';
import SidePanelCloseLeft from './Sources/SidePanelCloseLeft';
import SidePanelCloseRight from './Sources/SidePanelCloseRight';
import SortingAscending from './Sources/SortingAscending';
import SortingDescending from './Sources/SortingDescending';
import StatusError from './Sources/StatusError';
import StatusSuccess from './Sources/StatusSuccess';
import StatusTracking from './Sources/StatusTracking';
import StatusUntracked from './Sources/StatusUntracked';
import StatusWarning from './Sources/StatusWarning';
import Tab4D from './Sources/Tab4D';
import TabLinear from './Sources/TabLinear';
import TabPatientInfo from './Sources/TabPatientInfo';
import TabRoiThreshold from './Sources/TabRoiThreshold';
import TabSegmentation from './Sources/TabSegmentation';
import TabStudies from './Sources/TabStudies';
import ThumbnailView from './Sources/ThumbnailView';
import Trash from './Sources/Trash';
import ViewportViews from './Sources/ViewportViews';
import Sorting from './Sources/Sorting';
import Upload from './Sources/Upload';
import LaunchArrow from './Sources/LaunchArrow';
import LaunchInfo from './Sources/LaunchInfo';
import GroupLayers from './Sources/GroupLayers';
import Database from './Sources/Database';
import InvestigationalUse from './Sources/InvestigationalUse';
import IconTransferring from './Sources/IconTransferring';
import Alert from './Sources/Alert';
import AlertOutline from './Sources/AlertOutline';
import Clipboard from './Sources/Clipboard';
import {
  Tool3DRotate,
  ToolAngle,
  ToolAnnotate,
  ToolBidirectional,
  ToolCalibrate,
  ToolCapture,
  ToolCine,
  ToolCircle,
  ToolCobbAngle,
  ToolCreateThreshold,
  ToolCrosshair,
  ToolDicomTagBrowser,
  ToolFlipHorizontal,
  ToolFreehandPolygon,
  ToolFreehandRoi,
  ToolFreehand,
  ToolFusionColor,
  ToolInvert,
  ToolLayoutDefault,
  ToolLength,
  ToolMagneticRoi,
  ToolMagnify,
  ToolMeasureEllipse,
  ToolMoreMenu,
  ToolMove,
  ToolPolygon,
  ToolQuickMagnify,
  ToolRectangle,
  ToolReferenceLines,
  ToolReset,
  ToolRotateRight,
  ToolSegBrush,
  ToolSegEraser,
  ToolSegShape,
  ToolSegThreshold,
  ToolSplineRoi,
  ToolStackImageSync,
  ToolStackScroll,
  ToolToggleDicomOverlay,
  ToolUltrasoundBidirectional,
  ToolWindowLevel,
  ToolWindowRegion,
  ToolZoom,
  ToolLayout,
  ToolProbe,
  ToolEraser,
  ToolBrush,
  ToolThreshold,
  ToolShape,
} from './Sources/Tools';
import ActionNewDialog from './Sources/ActionNewDialog';
import NotificationInfo from './Sources/NotificationInfo';
import StatusLocked from './Sources/StatusLocked';
import ContentPrev from './Sources/ContentPrev';
import ContentNext from './Sources/ContentNext';
import CheckBoxChecked from './Sources/CheckBoxChecked';
import CheckBoxUnchecked from './Sources/CheckBoxUnChecked';
import Close from './Sources/Close';
import Pause from './Sources/Pause';
import Play from './Sources/Play';
import ViewportWindowLevel from './Sources/ViewportWindowLevel';
import Search from './Sources/Search';
import Clear from './Sources/Clear';
import {
  LayoutAdvanced3DOnly,
  LayoutAdvanced3DPrimary,
  LayoutAdvancedAxialPrimary,
  LayoutAdvancedMPR,
  LayoutCommon2x2,
  LayoutCommon1x1,
  LayoutCommon1x2,
  LayoutCommon2x3,
  LayoutAdvanced3DFourUp,
  LayoutAdvanced3DMain,
} from './Sources/Layout';
import Link from './Sources/Link';
import IconColorLUT from './Sources/IconColorLUT';
import CTAAA from '../../../assets/images/CT-AAA.png';
import CTAAA2 from '../../../assets/images/CT-AAA2.png';
import CTAir from '../../../assets/images/CT-Air.png';
import CTBone from '../../../assets/images/CT-Bone.png';
import CTBones from '../../../assets/images/CT-Bones.png';
import CTCardiac from '../../../assets/images/CT-Cardiac.png';
import CTCardiac2 from '../../../assets/images/CT-Cardiac2.png';
import CTCardiac3 from '../../../assets/images/CT-Cardiac3.png';
import CTChestContrastEnhanced from '../../../assets/images/CT-Chest-Contrast-Enhanced.png';
import CTChestVessels from '../../../assets/images/CT-Chest-Vessels.png';
import CTCoronaryArteries from '../../../assets/images/CT-Coronary-Arteries.png';
import CTCoronaryArteries2 from '../../../assets/images/CT-Coronary-Arteries-2.png';
import CTCoronaryArteries3 from '../../../assets/images/CT-Coronary-Arteries-3.png';
import CTCroppedVolumeBone from '../../../assets/images/CT-Cropped-Volume-Bone.png';
import CTFat from '../../../assets/images/CT-Fat.png';
import CTLiverVasculature from '../../../assets/images/CT-Liver-Vasculature.png';
import CTLung from '../../../assets/images/CT-Lung.png';
import CTMIP from '../../../assets/images/CT-MIP.png';
import CTMuscle from '../../../assets/images/CT-Muscle.png';
import CTPulmonaryArteries from '../../../assets/images/CT-Pulmonary-Arteries.png';
import CTSoftTissue from '../../../assets/images/CT-Soft-Tissue.png';
import DTIFABrain from '../../../assets/images/DTI-FA-Brain.png';
import MRAngio from '../../../assets/images/MR-Angio.png';
import MRDefault from '../../../assets/images/MR-Default.png';
import MRMIP from '../../../assets/images/MR-MIP.png';
import MRT2Brain from '../../../assets/images/MR-T2-Brain.png';
import VolumeRendering from '../../../assets/images/VolumeRendering.png';
import ExternalLink from './Sources/ExternalLink';
import OHIFLogoColorDarkBackground from './Sources/OHIFLogoColorDarkBackground';
import Magnifier from './Sources/Magnifier';
import LoadingOHIFMark from './Sources/LoadingOHIFMark';
import ArrowLeftBold from './Sources/ArrowLeftBold';
import Pencil from './Sources/Pencil';
//
//
//
type IconProps = React.HTMLAttributes<SVGElement>;
type ImageIconProps = React.ImgHTMLAttributes<HTMLImageElement>;

const ImageWrapper = ({ src, ...props }: { src: string } & ImageIconProps) => {
  return (
    <img
      src={src}
      {...props}
      alt=""
    />
  );
};

export const Icons = {
  CTAAA: (props: ImageIconProps) => (
    <ImageWrapper
      src={CTAAA}
      {...props}
    />
  ),
  CTAAA2: (props: ImageIconProps) => (
    <ImageWrapper
      src={CTAAA2}
      {...props}
    />
  ),
  CTAir: (props: ImageIconProps) => (
    <ImageWrapper
      src={CTAir}
      {...props}
    />
  ),
  CTBone: (props: ImageIconProps) => (
    <ImageWrapper
      src={CTBone}
      {...props}
    />
  ),
  CTBones: (props: ImageIconProps) => (
    <ImageWrapper
      src={CTBones}
      {...props}
    />
  ),
  CTCardiac: (props: ImageIconProps) => (
    <ImageWrapper
      src={CTCardiac}
      {...props}
    />
  ),
  CTCardiac2: (props: ImageIconProps) => (
    <ImageWrapper
      src={CTCardiac2}
      {...props}
    />
  ),
  CTCardiac3: (props: ImageIconProps) => (
    <ImageWrapper
      src={CTCardiac3}
      {...props}
    />
  ),
  CTChestContrastEnhanced: (props: ImageIconProps) => (
    <ImageWrapper
      src={CTChestContrastEnhanced}
      {...props}
    />
  ),
  CTChestVessels: (props: ImageIconProps) => (
    <ImageWrapper
      src={CTChestVessels}
      {...props}
    />
  ),
  CTCoronaryArteries: (props: ImageIconProps) => (
    <ImageWrapper
      src={CTCoronaryArteries}
      {...props}
    />
  ),
  CTCoronaryArteries2: (props: ImageIconProps) => (
    <ImageWrapper
      src={CTCoronaryArteries2}
      {...props}
    />
  ),
  CTCoronaryArteries3: (props: ImageIconProps) => (
    <ImageWrapper
      src={CTCoronaryArteries3}
      {...props}
    />
  ),
  CTCroppedVolumeBone: (props: ImageIconProps) => (
    <ImageWrapper
      src={CTCroppedVolumeBone}
      {...props}
    />
  ),
  CTFat: (props: ImageIconProps) => (
    <ImageWrapper
      src={CTFat}
      {...props}
    />
  ),
  CTLiverVasculature: (props: ImageIconProps) => (
    <ImageWrapper
      src={CTLiverVasculature}
      {...props}
    />
  ),
  CTLung: (props: ImageIconProps) => (
    <ImageWrapper
      src={CTLung}
      {...props}
    />
  ),
  CTMIP: (props: ImageIconProps) => (
    <ImageWrapper
      src={CTMIP}
      {...props}
    />
  ),
  CTMuscle: (props: ImageIconProps) => (
    <ImageWrapper
      src={CTMuscle}
      {...props}
    />
  ),
  CTPulmonaryArteries: (props: ImageIconProps) => (
    <ImageWrapper
      src={CTPulmonaryArteries}
      {...props}
    />
  ),
  CTSoftTissue: (props: ImageIconProps) => (
    <ImageWrapper
      src={CTSoftTissue}
      {...props}
    />
  ),
  DTIFABrain: (props: ImageIconProps) => (
    <ImageWrapper
      src={DTIFABrain}
      {...props}
    />
  ),
  MRAngio: (props: ImageIconProps) => (
    <ImageWrapper
      src={MRAngio}
      {...props}
    />
  ),
  MRDefault: (props: ImageIconProps) => (
    <ImageWrapper
      src={MRDefault}
      {...props}
    />
  ),
  MRMIP: (props: ImageIconProps) => (
    <ImageWrapper
      src={MRMIP}
      {...props}
    />
  ),
  MRT2Brain: (props: ImageIconProps) => (
    <ImageWrapper
      src={MRT2Brain}
      {...props}
    />
  ),
  VolumeRendering: (props: ImageIconProps) => (
    <ImageWrapper
      src={VolumeRendering}
      {...props}
    />
  ),
  // Icons
  Clipboard,
  ActionNewDialog,
  GroupLayers,
  Database,
  InvestigationalUse,
  Tool3DRotate,
  ToolAngle,
  ToolAnnotate,
  ToolBidirectional,
  ToolCalibrate,
  ToolCapture,
  ToolCine,
  ToolCircle,
  ToolCobbAngle,
  ToolCreateThreshold,
  ToolCrosshair,
  ToolDicomTagBrowser,
  ToolFlipHorizontal,
  ToolFreehandPolygon,
  ToolFreehandRoi,
  ToolFreehand,
  ToolFusionColor,
  ToolInvert,
  ToolLayoutDefault,
  ToolLength,
  ToolMagneticRoi,
  ToolMagnify,
  ToolMeasureEllipse,
  ToolMoreMenu,
  ToolMove,
  ToolPolygon,
  ToolQuickMagnify,
  ToolRectangle,
  ToolReferenceLines,
  ToolReset,
  ToolRotateRight,
  ToolSegBrush,
  ToolSegEraser,
  ToolSegShape,
  ToolSegThreshold,
  ToolSplineRoi,
  ToolStackImageSync,
  ToolStackScroll,
  ToolToggleDicomOverlay,
  ToolUltrasoundBidirectional,
  ToolWindowLevel,
  ToolWindowRegion,
  ToolZoom,
  LaunchArrow,
  LaunchInfo,
  Upload,
  Actions,
  Add,
  Cancel,
  Code,
  ColorChange,
  Controls,
  Delete,
  DicomTagBrowser,
  DisplayFillAndOutline,
  DisplayFillOnly,
  DisplayOutlineOnly,
  FillAndOutline: DisplayFillAndOutline,
  FillOnly: DisplayFillOnly,
  OutlineOnly: DisplayOutlineOnly,
  Download,
  Export,
  EyeHidden,
  EyeVisible,
  GearSettings,
  Hide,
  IconMPR,
  Info,
  InfoLink,
  InfoSeries,
  ListView,
  LoadingSpinner,
  Lock,
  Minus,
  MissingIcon,
  More,
  MultiplePatients,
  NavigationPanelReveal,
  OHIFLogo,
  Patient,
  Pin,
  PinFill,
  Plus,
  PowerOff,
  Refresh,
  Rename,
  Series,
  Settings,
  Show,
  SidePanelCloseLeft,
  SidePanelCloseRight,
  SortingAscending,
  SortingDescending,
  Sorting,
  StatusError,
  StatusSuccess,
  StatusTracking,
  StatusWarning,
  StatusUntracked,
  Tab4D,
  TabLinear,
  TabPatientInfo,
  TabRoiThreshold,
  TabSegmentation,
  TabStudies,
  ThumbnailView,
  Trash,
  ViewportViews,
  ChevronClosed,
  ChevronOpen,
  Alert,
  AlertOutline,
  NotificationInfo,
  StatusLocked,
  ContentPrev,
  ContentNext,
  CheckBoxChecked,
  CheckBoxUnchecked,
  Close,
  Pause,
  Play,
  Link,
  LoadingOHIFMark,
  ArrowLeft: ChevronClosed,
  ArrowRight: (props: IconProps) => {
    return (
      <ChevronClosed
        {...props}
        className="rotate-180"
      />
    );
  },
  ArrowLeftBold,
  ArrowRightBold: (props: IconProps) => {
    return (
      <ArrowLeftBold
        {...props}
        className="rotate-180"
      />
    );
  },
  ArrowDown: (props: IconProps) => {
    return (
      <ChevronOpen
        {...props}
        className="rotate-180"
      />
    );
  },
  ViewportWindowLevel,
  Search,
  Clear,
  LayoutCommon2x3,
  LayoutCommon2x2,
  LayoutCommon1x1,
  LayoutCommon1x2,
  LayoutAdvanced3DFourUp,
  LayoutAdvanced3DMain,
  LayoutAdvanced3DOnly,
  LayoutAdvanced3DPrimary,
  LayoutAdvancedAxialPrimary,
  LayoutAdvancedMPR,
  ToolLayout,
  IconColorLUT,
  ToolEraser,
  ToolBrush,
  ToolThreshold,
  ToolShape,
  ExternalLink,
  OHIFLogoColorDarkBackground,
  Magnifier,
  Pencil,
  //
  //
  //
  //
  //
  //
  //
  //
  //
  // Aliases
  'prev-arrow': (props: IconProps) => Icons.ArrowLeftBold(props),
  'next-arrow': (props: IconProps) => Icons.ArrowRightBold(props),
  'loading-ohif-mark': (props: IconProps) => LoadingOHIFMark(props),
  magnifier: (props: IconProps) => Magnifier(props),
  'status-alert-warning': (props: IconProps) => StatusWarning(props),
  'logo-dark-background': (props: IconProps) => OHIFLogoColorDarkBackground(props),
  'external-link': (props: IconProps) => ExternalLink(props),
  'checkbox-checked': (props: IconProps) => CheckBoxChecked(props),
  'checkbox-unchecked': (props: IconProps) => CheckBoxUnchecked(props),
  'checkbox-default': (props: IconProps) => CheckBoxUnchecked(props),
  'checkbox-active': (props: IconProps) => CheckBoxChecked(props),
  'icon-tool-eraser': (props: IconProps) => ToolEraser(props),
  'icon-tool-brush': (props: IconProps) => ToolBrush(props),
  'icon-tool-threshold': (props: IconProps) => ToolThreshold(props),
  'icon-tool-shape': (props: IconProps) => ToolShape(props),
  link: (props: IconProps) => Link(props),
  'icon-color-lut': (props: IconProps) => IconColorLUT(props),
  'icon-link': (props: IconProps) => Link(props),
  'icon-clear': (props: IconProps) => Clear(props),
  'icon-search': (props: IconProps) => Search(props),
  'viewport-window-level': (props: IconProps) => ViewportWindowLevel(props),
  'action-new-dialog': (props: IconProps) => ActionNewDialog(props),
  'arrow-left': (props: IconProps) => Icons.ArrowLeft(props),
  'arrow-right': (props: IconProps) => Icons.ArrowRight(props),
  'arrow-down': (props: IconProps) => Icons.ArrowDown(props),
  'status-tracked': (props: IconProps) => StatusTracking(props),
  'status-untracked': (props: IconProps) => StatusUntracked(props),
  'status-locked': (props: IconProps) => StatusLocked(props),
  'tab-segmentation': (props: IconProps) => TabSegmentation(props),
  'tab-studies': (props: IconProps) => TabStudies(props),
  'tab-linear': (props: IconProps) => TabLinear(props),
  'tab-4d': (props: IconProps) => Tab4D(props),
  'tab-patient-info': (props: IconProps) => TabPatientInfo(props),
  'tab-roi-threshold': (props: IconProps) => TabRoiThreshold(props),
  'icon-mpr': (props: IconProps) => IconMPR(props),
  'power-off': (props: IconProps) => PowerOff(props),
  'icon-multiple-patients': (props: IconProps) => MultiplePatients(props),
  'icon-patient': (props: IconProps) => Patient(props),
  'chevron-down': (props: IconProps) => ChevronOpen(props),
  'tool-length': (props: IconProps) => ToolLength(props),
  'tool-3d-rotate': (props: IconProps) => Tool3DRotate(props),
  'tool-angle': (props: IconProps) => ToolAngle(props),
  'tool-annotate': (props: IconProps) => ToolAnnotate(props),
  'tool-bidirectional': (props: IconProps) => ToolBidirectional(props),
  'tool-calibration': (props: IconProps) => ToolCalibrate(props),
  'tool-capture': (props: IconProps) => ToolCapture(props),
  'tool-cine': (props: IconProps) => ToolCine(props),
  'tool-circle': (props: IconProps) => ToolCircle(props),
  'tool-cobb-angle': (props: IconProps) => ToolCobbAngle(props),
  'tool-create-threshold': (props: IconProps) => ToolCreateThreshold(props),
  'tool-crosshair': (props: IconProps) => ToolCrosshair(props),
  'dicom-tag-browser': (props: IconProps) => ToolDicomTagBrowser(props),
  'tool-flip-horizontal': (props: IconProps) => ToolFlipHorizontal(props),
  'tool-freehand-polygon': (props: IconProps) => ToolFreehandPolygon(props),
  'tool-freehand-roi': (props: IconProps) => ToolFreehandRoi(props),
  'icon-tool-freehand-roi': (props: IconProps) => ToolFreehandRoi(props),
  'icon-tool-spline-roi': (props: IconProps) => ToolSplineRoi(props),
  'tool-freehand': (props: IconProps) => ToolFreehand(props),
  'tool-fusion-color': (props: IconProps) => ToolFusionColor(props),
  'tool-invert': (props: IconProps) => ToolInvert(props),
  'tool-layout-default': (props: IconProps) => ToolLayoutDefault(props),
  'tool-magnetic-roi': (props: IconProps) => ToolMagneticRoi(props),
  'icon-tool-livewire': (props: IconProps) => ToolMagneticRoi(props),
  'tool-magnify': (props: IconProps) => ToolMagnify(props),
  'tool-measure-ellipse': (props: IconProps) => ToolMeasureEllipse(props),
  'tool-more-menu': (props: IconProps) => ToolMoreMenu(props),
  'tool-move': (props: IconProps) => ToolMove(props),
  'tool-polygon': (props: IconProps) => ToolPolygon(props),
  'tool-ellipse': (props: IconProps) => ToolMeasureEllipse(props),
  'tool-quick-magnify': (props: IconProps) => ToolQuickMagnify(props),
  'tool-rectangle': (props: IconProps) => ToolRectangle(props),
  'tool-referenceLines': (props: IconProps) => ToolReferenceLines(props),
  'tool-reset': (props: IconProps) => ToolReset(props),
  'tool-rotate-right': (props: IconProps) => ToolRotateRight(props),
  'tool-seg-brush': (props: IconProps) => ToolSegBrush(props),
  'tool-seg-eraser': (props: IconProps) => ToolSegEraser(props),
  'tool-seg-shape': (props: IconProps) => ToolSegShape(props),
  'tool-seg-threshold': (props: IconProps) => ToolSegThreshold(props),
  'tool-spline-roi': (props: IconProps) => ToolSplineRoi(props),
  'tool-stack-image-sync': (props: IconProps) => ToolStackImageSync(props),
  'tool-stack-scroll': (props: IconProps) => ToolStackScroll(props),
  'toggle-dicom-overlay': (props: IconProps) => ToolToggleDicomOverlay(props),
  'tool-ultrasound-bidirectional': (props: IconProps) => ToolUltrasoundBidirectional(props),
  'tool-window-level': (props: IconProps) => ToolWindowLevel(props),
  'tool-window-region': (props: IconProps) => ToolWindowRegion(props),
  'icon-tool-window-region': (props: IconProps) => ToolWindowRegion(props),
  'icon-tool-ultrasound-bidirectional': (props: IconProps) => ToolUltrasoundBidirectional(props),
  'icon-tool-cobb-angle': (props: IconProps) => ToolCobbAngle(props),
  'icon-tool-loupe': (props: IconProps) => ToolMagnify(props),
  'tool-probe': (props: IconProps) => ToolProbe(props),
  'icon-tool-probe': (props: IconProps) => ToolProbe(props),
  'tool-zoom': (props: IconProps) => ToolZoom(props),
  'tool-layout': (props: IconProps) => ToolLayout(props),
  'icon-transferring': (props: IconProps) => IconTransferring(props),
  'icon-alert-small': (props: IconProps) => Alert(props),
  'icon-alert-outline': (props: IconProps) => AlertOutline(props),
  'status-alert': (props: IconProps) => Alert(props),
  info: (props: IconProps) => Info(props),
  'notifications-info': (props: IconProps) => NotificationInfo(props),
  'content-prev': (props: IconProps) => ContentPrev(props),
  'content-next': (props: IconProps) => ContentNext(props),
  'icon-settings': (props: IconProps) => Settings(props),
  close: (props: IconProps) => Close(props),
  pause: (props: IconProps) => Pause(props),
  'icon-pause': (props: IconProps) => Pause(props),
  settings: (props: IconProps) => Settings(props),
  play: (props: IconProps) => Play(props),
  'icon-play': (props: IconProps) => Play(props),
  'layout-advanced-3d-four-up': (props: IconProps) => LayoutAdvanced3DFourUp(props),
  'layout-advanced-3d-main': (props: IconProps) => LayoutAdvanced3DMain(props),
  'layout-advanced-3d-only': (props: IconProps) => LayoutAdvanced3DOnly(props),
  'layout-advanced-3d-primary': (props: IconProps) => LayoutAdvanced3DPrimary(props),
  'layout-advanced-axial-primary': (props: IconProps) => LayoutAdvancedAxialPrimary(props),
  'layout-advanced-mpr': (props: IconProps) => LayoutAdvancedMPR(props),
  'layout-common-1x1': (props: IconProps) => LayoutCommon1x1(props),
  'layout-common-1x2': (props: IconProps) => LayoutCommon1x2(props),
  'layout-common-2x2': (props: IconProps) => LayoutCommon2x2(props),
  'layout-common-2x3': (props: IconProps) => LayoutCommon2x3(props),
  pencil: (props: IconProps) => Pencil(props),
  'icon-list-view': (props: IconProps) => ListView(props),
  clipboard: (props: IconProps) => Clipboard(props),

  /** Adds an icon to the set of icons */
  addIcon: (name: string, icon) => {
    if (Icons[name]) {
      console.warn('Replacing icon', name);
    }
    Icons[name] = icon;
  },

  ByName: ({ name, className, ...props }: { name: string; className?: string }) => {
    const IconComponent = Icons[name];

    if (!IconComponent) {
      console.debug(`Icon "${name}" not found.`);
      return <div>Missing Icon</div>;
    }

    return (
      <IconComponent
        {...props}
        className={className}
      />
    );
  },
};
