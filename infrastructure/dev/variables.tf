###############################################################################
# Variables - Development Environment
###############################################################################

variable "docker_image" {
  description = "Docker image to use for the OHIF Viewer"
  type        = string
  default     = "390844750153.dkr.ecr.eu-west-1.amazonaws.com/fnd-dev-ohif-viewer-frontend-ecr:0.0.2"
}