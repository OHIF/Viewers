terraform {
  backend "s3" {
    bucket       = "fnd-prod-g-tfstate"   # S3 bucket name for state storage
    key          = "ohif-viewer-frontend" # State file key/path within the bucket
    region       = "eu-west-1"            # Region where the S3 bucket is located
    encrypt      = true                   # Enable server-side encryption for the state file
    use_lockfile = true                   # Enable state locking to prevent concurrent modifications
  }
}

data "terraform_remote_state" "network" {
  backend = "s3"

  config = {
    bucket = "fnd-prod-g-tfstate" # Same bucket as our state
    key    = "network"            # Key for the network state file
    region = "eu-west-1"          # Region where the S3 bucket is located
  }
}

data "terraform_remote_state" "compute" {
  backend = "s3"

  config = {
    bucket = "fnd-prod-g-tfstate" # Same bucket as our state
    key    = "compute"            # Key for the network state file
    region = "eu-west-1"          # Region where the S3 bucket is located
  }
}

data "terraform_remote_state" "security" {
  backend = "s3"

  config = {
    bucket = "fnd-prod-g-tfstate" # Same bucket as our state
    key    = "security"           # Key for the network state file
    region = "eu-west-1"          # Region where the S3 bucket is located
  }
}

data "terraform_remote_state" "databases" {
  backend = "s3"

  config = {
    bucket = "fnd-prod-g-tfstate" # Same bucket as our state
    key    = "databases"          # Key for the network state file
    region = "eu-west-1"          # Region where the S3 bucket is located
  }
}