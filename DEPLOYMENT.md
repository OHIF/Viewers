# Deployment Guide

This document outlines the deployment process for the OHIF Viewer application.

## Infrastructure Management

### Terraform Deployment (Manual)
The Terraform infrastructure files located in the `infrastructure/` directory are deployed **manually**. These files define the cloud resources needed for the application.

- **Development Environment**: `infrastructure/dev/`
- **Production Environment**: `infrastructure/prod/`

To deploy infrastructure changes:
1. Navigate to the appropriate environment directory
2. Run `terraform plan` to review changes
3. Run `terraform apply` to deploy changes

## Application Deployment

### Development/Staging Deployment
- **Trigger**: Merge to `main` branch
- **Process**: 
  1. CI/CD pipeline generates final static files
  2. Automated deployment to staging bucket
  3. CloudFront cache invalidation

### Production Deployment
- **Trigger**: Git tag creation
- **Process**:
  1. CI/CD pipeline generates final static files
  2. Automated deployment to production bucket  
  3. CloudFront cache invalidation

## Deployment Workflow

```
Code Changes → Merge to main → Generate Static Files → Deploy to Staging → Invalidate Cache
                    ↓
            Create Git Tag → Generate Static Files → Deploy to Production → Invalidate Cache
```

## Notes

- All application deployments are automated via CI/CD
- Infrastructure changes require manual Terraform deployment
- Cache invalidation is automatically handled during deployments
- Production deployments are controlled via git tags for release management