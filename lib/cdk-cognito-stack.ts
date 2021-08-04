import * as cdk from '@aws-cdk/core';
import * as cognito from '@aws-cdk/aws-cognito';
import * as iam from '@aws-cdk/aws-iam';
import { CfnOutput } from '@aws-cdk/core';

export class CdkCognitoStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // create identity pool
    const myidpool = new cognito.CfnIdentityPool(this, 'myidpool', {
      allowUnauthenticatedIdentities: true,
    });

    // create role
    const authrole = new iam.Role(this, 'congitoauth', {
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': myidpool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'unauthenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity',
      ),
    });
    authrole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'mobileanalytics:PutEvents',
          'cognito-sync:*',
          'cognito-identity:*',
        ],
        resources: ['*'],
      }),
    );
    const unauthrole = new iam.Role(this, 'congitounauth', {
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': myidpool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'unauthenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity',
      ),
    });

    unauthrole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['mobileanalytics:PutEvents', 'cognito-sync:*'],
        resources: ['*'],
      }),
    );
    unauthrole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonPollyFullAccess'),
    );
    new cognito.CfnIdentityPoolRoleAttachment(this, 'attachrole', {
      identityPoolId: myidpool.ref,
      roles: {
        unauthenticated: unauthrole.roleArn,
        authenticated: authrole.roleArn,
      },
    });

    new CfnOutput(this, 'id', {
      value: myidpool.ref,
    });
  }
}
