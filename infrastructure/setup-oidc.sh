#!/bin/bash
# GitHub Actions OIDC Setup Script

set -e

echo "🔐 Setting up GitHub Actions OIDC..."

# Create OIDC provider
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --thumbprint-list \
  --client-id-list sts.amazonaws.com \
  --output json

# Create IAM role for GitHub Actions
cat > github-actions-role.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::${AWS_ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:guild/platform:*"
        }
      }
    }
  ]
}
EOF

aws iam create-role \
  --role-name github-actions-oidc \
  --assume-role-policy-document file://github-actions-role.json

# Attach policies to the role
aws iam attach-role-policy \
  --role-name github-actions-oidc \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess

aws iam attach-role-policy \
  --role-name github-actions-oidc \
  --policy-arn arn:aws:iam::aws:policy/AmazonECS_FullAccess

aws iam attach-role-policy \
  --role-name github-actions-oidc \
  --policy-arn arn:aws:iam::aws:policy/AmazonEKS_FullAccess

# Get role ARN
ROLE_ARN=$(aws iam get-role --role-name github-actions-oidc --query 'Role.Arn' --output text)

echo "✅ GitHub Actions OIDC setup completed!"
echo "Role ARN: $ROLE_ARN"

# Clean up temporary file
rm github-actions-role.json
