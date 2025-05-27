# Configure Terraform settings and minimum versions
terraform {
  # Ensure we're using Terraform 1.8.0 or newer to maintain compatibility
  required_version = ">= 1.8.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws" # AWS provider from HashiCorp
      version = "~> 5.0"        # Use AWS provider version 5.x
    }
  }
}

# Configure the AWS provider for EU (Ireland) region
provider "aws" {
  region = "eu-west-1" # EU Ireland region for all resources
}