import { Palette } from './palette';

export const axis = [
  {
    // Frontal & Lateral
    tail: 'femur_medullar_canal_center',
    head: 'femur_distal_cortical_center',
    color: Palette.Pink,
    highlighted: Palette.DarkPink,
  },

  // Tibia : mechanical axis
  {
    // Frontal & Lateral
    tail: 'tibia_proximal_cortical_center',
    head: 'tibial_medullar_canal_center',
    color: Palette.Blue,
    highlighted: Palette.DarkBlue,
  },

  // Tangent of the femoral condyles
  {
    // Frontal version
    tail: 'femur_condyle_exterior',
    head: 'femur_condyle_interior',
    color: Palette.Turquoise,
    highlighted: Palette.DarkTurquoise,
  },
  {
    // Lateral version
    tail: 'femur_condyle_distal',
    head: 'projected_patella_distal',
    color: Palette.Turquoise,
    highlighted: Palette.DarkTurquoise,
    dotted: true,
  },

  // Tibia : Prosthetic Plateau
  {
    // Frontal version
    tail: 'tibia_prosthesis_proximal_exterior',
    head: 'tibia_prosthesis_proximal_interior',
    color: Palette.Yellow,
    highlighted: Palette.DarkYellow,
  },
  {
    // Lateral version
    tail: 'tibia_plateau_posterior',
    head: 'tibia_plateau_anterior',
    color: Palette.Yellow,
    highlighted: Palette.DarkYellow,
  },

  // * Lateral Only *
  // Patella
  {
    tail: 'patella_proximal',
    head: 'patella_distal',
    color: Palette.Purple,
    highlighted: Palette.DarkPurple,
  },
  // Patella Height Axis
  {
    tail: 'patella_distal',
    head: 'projected_patella_distal',
    color: Palette.LightBlue,
    highlighted: Palette.DarkLightBlue,
    dotted: true,
  },

  // * Skyline Only *
  // Patella Transverse Axis
  {
    // Left
    tail: 'patella_transverse_interior_left',
    head: 'patella_transverse_exterior_left',
    color: Palette.Purple,
    highlighted: Palette.DarkPurple,
  },
  {
    // Right
    tail: 'patella_transverse_interior_right',
    head: 'patella_transverse_exterior_right',
    color: Palette.Purple,
    highlighted: Palette.DarkPurple,
  },
  // Femoral Condyles Tangent
  {
    // Left
    tail: 'femur_condyle_interior_left',
    head: 'femur_condyle_exterior_left',
    color: Palette.Turquoise,
    highlighted: Palette.DarkTurquoise,
  },
  {
    // Right
    tail: 'femur_condyle_interior_right',
    head: 'femur_condyle_exterior_right',
    color: Palette.Turquoise,
    highlighted: Palette.DarkTurquoise,
  },
  {
    tail: 'hip_rotation_center_left',
    head: 'femur_neck_femoral_anatomical_axis_intersection_left',
    color: Palette.LightBlue,
    highlighted: Palette.DarkLightBlue,
  },
  {
    tail: 'hip_rotation_center_right',
    head: 'femur_neck_femoral_anatomical_axis_intersection_right',
    color: Palette.LightBlue,
    highlighted: Palette.DarkLightBlue,
  },
  // Femur : mechanical axis
  {
    tail: 'hip_rotation_center_left',
    head: 'femoral_notch_left',
    color: Palette.Purple,
    highlighted: Palette.DarkPurple,
  },
  {
    tail: 'hip_rotation_center_right',
    head: 'femoral_notch_right',
    color: Palette.Purple,
    highlighted: Palette.DarkPurple,
  },
  // Femur anatomical axis
  {
    tail: 'femur_axis_proximal_center_left',
    head: 'femur_axis_distal_center_left',
    color: Palette.Pink,
    highlighted: Palette.DarkPink,
  },
  {
    tail: 'femur_axis_proximal_center_right',
    head: 'femur_axis_distal_center_right',
    color: Palette.Pink,
    highlighted: Palette.DarkPink,
  },
  // condyles tangent
  {
    tail: 'condyle_external_left',
    head: 'condyle_internal_left',
    color: Palette.Turquoise,
    highlighted: Palette.DarkTurquoise,
  },
  {
    tail: 'condyle_external_right',
    head: 'condyle_internal_right',
    color: Palette.Turquoise,
    highlighted: Palette.DarkTurquoise,
  },
  // Tibia mechanical axis
  {
    tail: 'tibial_spines_left',
    head: 'ankle_center_left',
    color: Palette.Blue,
    highlighted: Palette.DarkBlue,
  },
  {
    tail: 'tibial_spines_right',
    head: 'ankle_center_right',
    color: Palette.Blue,
    highlighted: Palette.DarkBlue,
  },
  // Tibia plateau
  {
    tail: 'plateau_external_left',
    head: 'plateau_internal_left',
    color: Palette.Yellow,
    highlighted: Palette.DarkYellow,
  },
  {
    tail: 'plateau_external_right',
    head: 'plateau_internal_right',
    color: Palette.Yellow,
    highlighted: Palette.DarkYellow,
  },
  // Ankle axis
  {
    tail: 'ankle_external_left',
    head: 'ankle_internal_left',
    color: Palette.Red,
    highlighted: Palette.DarkRed,
  },
  {
    tail: 'ankle_external_right',
    head: 'ankle_internal_right',
    color: Palette.Red,
    highlighted: Palette.DarkRed,
  },
  {
    tail: 'pelvis_distal_left',
    head: 'pelvis_distal_right',
    color: Palette.Yellow,
    highlighted: Palette.DarkYellow,
  },
  // Femur anatomical axis
  {
    tail: 'femur_distal_center_left',
    head: 'femur_anatomical_axis_hip_offset_intersection_left',
    color: Palette.Pink,
    highlighted: Palette.DarkPink,
  },
  {
    tail: 'femur_distal_center_right',
    head: 'femur_anatomical_axis_hip_offset_intersection_right',
    color: Palette.Pink,
    highlighted: Palette.DarkPink,
  },
  // Prothese : cotyles
  {
    tail: 'cup_edge_external_left',
    head: 'cup_edge_internal_left',
    color: Palette.Red,
    highlighted: Palette.DarkRed,
  },
  {
    tail: 'cup_edge_external_right',
    head: 'cup_edge_internal_right',
    color: Palette.Red,
    highlighted: Palette.DarkRed,
  },
  {
    tail: 'stem_axis_proximal_left',
    head: 'stem_axis_distal_left',
    color: Palette.Purple,
    highlighted: Palette.DarkPurple,
  },
  {
    tail: 'stem_axis_proximal_right',
    head: 'stem_axis_distal_right',
    color: Palette.Purple,
    highlighted: Palette.DarkPurple,
  },
  {
    tail: 'pelvis_distal_left',
    head: 'pelvis_distal_right',
    color: Palette.Yellow,
    highlighted: Palette.DarkYellow,
  },
  {
    tail: 'glenoid_superior',
    head: 'glenoid_inferior',
    color: Palette.Purple,
    highlighted: Palette.DarkPurple,
  },
  {
    tail: 'scapula_border_medial',
    head: 'scapula_border_lateral',
    color: Palette.Pink,
    highlighted: Palette.DarkPink,
  },
  {
    tail: 'humerus_proximal',
    head: 'humerus_distal',
    color: Palette.Yellow,
    highlighted: Palette.DarkYellow,
  },
  {
    tail: 'supraspinal_fossa_medial',
    head: 'supraspinal_fossa_lateral',
    color: Palette.Red,
    highlighted: Palette.DarkRed,
  },

  {
    tail: 'humeral_plateau_inferior',
    head: 'humeral_plateau_superior',
    color: Palette.Orange,
    highlighted: Palette.DarkOrange,
  },
];
