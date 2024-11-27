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
    // Calibration ball
    tail: 'calibration_p1',
    head: 'calibration_p2',
    color: Palette.Orange,
    highlighted: Palette.DarkOrange,
  },
];
