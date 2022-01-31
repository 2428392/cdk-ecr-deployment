"use strict";
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ECRDeployment = exports.S3ArchiveName = exports.DockerImageName = void 0;
const JSII_RTTI_SYMBOL_1 = Symbol.for("jsii.rtti");
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
const child_process = require("child_process");
const path = require("path");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const constructs_1 = require("constructs");
function getCode() {
    const { CI, NO_PREBUILT_LAMBDA } = process.env;
    if (!(CI && ['true', true, 1, '1'].includes(CI)) || (NO_PREBUILT_LAMBDA && ['true', true, 1, '1'].includes(NO_PREBUILT_LAMBDA))) {
        try {
            console.log('Try to get prebuilt lambda');
            const installScript = path.join(__dirname, '../lambda/install.js');
            const prebuiltPath = path.join(__dirname, '../lambda/out');
            child_process.execSync(`${process.argv0} ${installScript} ${prebuiltPath}`);
            return aws_cdk_lib_1.aws_lambda.Code.fromAsset(prebuiltPath);
        }
        catch (err) {
            console.warn(`Can not get prebuilt lambda: ${err}`);
        }
    }
    console.log('Build lambda from scratch');
    return aws_cdk_lib_1.aws_lambda.Code.fromDockerBuild(path.join(__dirname, '../lambda'));
}
/**
 * @stability stable
 */
class DockerImageName {
    /**
     * @stability stable
     */
    constructor(name, creds) {
        this.name = name;
        this.creds = creds;
    }
    /**
     * The uri of the docker image.
     *
     * The uri spec follows https://github.com/containers/skopeo
     *
     * @stability stable
     */
    get uri() { return `docker://${this.name}`; }
}
exports.DockerImageName = DockerImageName;
_a = JSII_RTTI_SYMBOL_1;
DockerImageName[_a] = { fqn: "cdk-ecr-deployment.DockerImageName", version: "0.0.0" };
/**
 * @stability stable
 */
class S3ArchiveName {
    /**
     * @stability stable
     */
    constructor(p, ref, creds) {
        this.creds = creds;
        this.name = p;
        if (ref) {
            this.name += ':' + ref;
        }
    }
    /**
     * The uri of the docker image.
     *
     * The uri spec follows https://github.com/containers/skopeo
     *
     * @stability stable
     */
    get uri() { return `s3://${this.name}`; }
}
exports.S3ArchiveName = S3ArchiveName;
_b = JSII_RTTI_SYMBOL_1;
S3ArchiveName[_b] = { fqn: "cdk-ecr-deployment.S3ArchiveName", version: "0.0.0" };
/**
 * @stability stable
 */
class ECRDeployment extends constructs_1.Construct {
    /**
     * @stability stable
     */
    constructor(scope, id, props) {
        var _d;
        super(scope, id);
        const memoryLimit = (_d = props.memoryLimit) !== null && _d !== void 0 ? _d : 512;
        const handler = new aws_cdk_lib_1.aws_lambda.SingletonFunction(this, 'CustomResourceHandler', {
            uuid: this.renderSingletonUuid(memoryLimit),
            code: getCode(),
            runtime: aws_cdk_lib_1.aws_lambda.Runtime.GO_1_X,
            handler: 'main',
            environment: props.environment,
            lambdaPurpose: 'Custom::CDKECRDeployment',
            timeout: aws_cdk_lib_1.Duration.minutes(15),
            role: props.role,
            memorySize: memoryLimit,
            vpc: props.vpc,
            vpcSubnets: props.vpcSubnets,
        });
        const handlerRole = handler.role;
        if (!handlerRole) {
            throw new Error('lambda.SingletonFunction should have created a Role');
        }
        handlerRole.addToPrincipalPolicy(new aws_cdk_lib_1.aws_iam.PolicyStatement({
            effect: aws_cdk_lib_1.aws_iam.Effect.ALLOW,
            actions: [
                'ecr:GetAuthorizationToken',
                'ecr:BatchCheckLayerAvailability',
                'ecr:GetDownloadUrlForLayer',
                'ecr:GetRepositoryPolicy',
                'ecr:DescribeRepositories',
                'ecr:ListImages',
                'ecr:DescribeImages',
                'ecr:BatchGetImage',
                'ecr:ListTagsForResource',
                'ecr:DescribeImageScanFindings',
                'ecr:InitiateLayerUpload',
                'ecr:UploadLayerPart',
                'ecr:CompleteLayerUpload',
                'ecr:PutImage',
            ],
            resources: ['*'],
        }));
        handlerRole.addToPrincipalPolicy(new aws_cdk_lib_1.aws_iam.PolicyStatement({
            effect: aws_cdk_lib_1.aws_iam.Effect.ALLOW,
            actions: [
                's3:GetObject',
            ],
            resources: ['*'],
        }));
        new aws_cdk_lib_1.CustomResource(this, 'CustomResource', {
            serviceToken: handler.functionArn,
            resourceType: 'Custom::CDKBucketDeployment',
            properties: {
                SrcImage: props.src.uri,
                SrcCreds: props.src.creds,
                DestImage: props.dest.uri,
                DestCreds: props.dest.creds,
            },
        });
    }
    renderSingletonUuid(memoryLimit) {
        let uuid = 'bd07c930-edb9-4112-a20f-03f096f53666';
        // if user specify a custom memory limit, define another singleton handler
        // with this configuration. otherwise, it won't be possible to use multiple
        // configurations since we have a singleton.
        if (memoryLimit) {
            if (aws_cdk_lib_1.Token.isUnresolved(memoryLimit)) {
                throw new Error('Can\'t use tokens when specifying "memoryLimit" since we use it to identify the singleton custom resource handler');
            }
            uuid += `-${memoryLimit.toString()}MiB`;
        }
        return uuid;
    }
}
exports.ECRDeployment = ECRDeployment;
_c = JSII_RTTI_SYMBOL_1;
ECRDeployment[_c] = { fqn: "cdk-ecr-deployment.ECRDeployment", version: "0.0.0" };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxxRUFBcUU7QUFDckUsc0NBQXNDO0FBR3RDLCtDQUErQztBQUMvQyw2QkFBNkI7QUFDN0IsNkNBQW9IO0FBQ3BILDJDQUF1QztBQWlDdkMsU0FBUyxPQUFPO0lBQ2QsTUFBTSxFQUFFLEVBQUUsRUFBRSxrQkFBa0IsRUFBRSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUM7SUFDL0MsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLEVBQUU7UUFDL0gsSUFBSTtZQUNGLE9BQU8sQ0FBQyxHQUFHLENBQUMsNEJBQTRCLENBQUMsQ0FBQztZQUUxQyxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxzQkFBc0IsQ0FBQyxDQUFDO1lBQ25FLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLGVBQWUsQ0FBQyxDQUFDO1lBQzNELGFBQWEsQ0FBQyxRQUFRLENBQUMsR0FBRyxPQUFPLENBQUMsS0FBSyxJQUFJLGFBQWEsSUFBSSxZQUFZLEVBQUUsQ0FBQyxDQUFDO1lBRTVFLE9BQU8sd0JBQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxDQUFDO1NBQzVDO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixPQUFPLENBQUMsSUFBSSxDQUFDLGdDQUFnQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1NBQ3JEO0tBQ0Y7SUFFRCxPQUFPLENBQUMs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Z0JBQ1AsY0FBYzthQUNmO1lBQ0QsU0FBUyxFQUFFLENBQUMsR0FBRyxDQUFDO1NBQ2pCLENBQUMsQ0FBQyxDQUFDO1FBRUosSUFBSSw0QkFBYyxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtZQUN6QyxZQUFZLEVBQUUsT0FBTyxDQUFDLFdBQVc7WUFDakMsWUFBWSxFQUFFLDZCQUE2QjtZQUMzQyxVQUFVLEVBQUU7Z0JBQ1YsUUFBUSxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRztnQkFDdkIsUUFBUSxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSztnQkFDekIsU0FBUyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRztnQkFDekIsU0FBUyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSzthQUM1QjtTQUNGLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFTyxtQkFBbUIsQ0FBQyxXQUFvQjtRQUM5QyxJQUFJLElBQUksR0FBRyxzQ0FBc0MsQ0FBQztRQUVsRCwwRUFBMEU7UUFDMUUsMkVBQTJFO1FBQzNFLDRDQUE0QztRQUM1QyxJQUFJLFdBQVcsRUFBRTtZQUNmLElBQUksbUJBQUssQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLEVBQUU7Z0JBQ25DLE1BQU0sSUFBSSxLQUFLLENBQUMsbUhBQW1ILENBQUMsQ0FBQzthQUN0STtZQUVELElBQUksSUFBSSxJQUFJLFdBQVcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDO1NBQ3pDO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDOztBQTdFSCxzQ0E4RUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgQW1hem9uLmNvbSwgSW5jLiBvciBpdHMgYWZmaWxpYXRlcy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBBcGFjaGUtMi4wXG5cblxuaW1wb3J0ICogYXMgY2hpbGRfcHJvY2VzcyBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBhd3NfZWMyIGFzIGVjMiwgYXdzX2lhbSBhcyBpYW0sIGF3c19sYW1iZGEgYXMgbGFtYmRhLCBEdXJhdGlvbiwgQ3VzdG9tUmVzb3VyY2UsIFRva2VuIH0gZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRUNSRGVwbG95bWVudFByb3BzIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICByZWFkb25seSBzcmM6IElJbWFnZU5hbWU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gIHJlYWRvbmx5IGRlc3Q6IElJbWFnZU5hbWU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gIHJlYWRvbmx5IG1lbW9yeUxpbWl0PzogbnVtYmVyO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgcmVhZG9ubHkgcm9sZT86IGlhbS5JUm9sZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gIHJlYWRvbmx5IHZwYz86IGVjMi5JVnBjO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICByZWFkb25seSB2cGNTdWJuZXRzPzogZWMyLlN1Ym5ldFNlbGVjdGlvbjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gIHJlYWRvbmx5IGVudmlyb25tZW50PzogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJSW1hZ2VOYW1lIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgcmVhZG9ubHkgdXJpOiBzdHJpbmc7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICBjcmVkcz86IHN0cmluZztcbn1cblxuZnVuY3Rpb24gZ2V0Q29kZSgpOiBsYW1iZGEuQXNzZXRDb2RlIHtcbiAgY29uc3QgeyBDSSwgTk9fUFJFQlVJTFRfTEFNQkRBIH0gPSBwcm9jZXNzLmVudjtcbiAgaWYgKCEoQ0kgJiYgWyd0cnVlJywgdHJ1ZSwgMSwgJzEnXS5pbmNsdWRlcyhDSSkpIHx8IChOT19QUkVCVUlMVF9MQU1CREEgJiYgWyd0cnVlJywgdHJ1ZSwgMSwgJzEnXS5pbmNsdWRlcyhOT19QUkVCVUlMVF9MQU1CREEpKSkge1xuICAgIHRyeSB7XG4gICAgICBjb25zb2xlLmxvZygnVHJ5IHRvIGdldCBwcmVidWlsdCBsYW1iZGEnKTtcblxuICAgICAgY29uc3QgaW5zdGFsbFNjcmlwdCA9IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi9sYW1iZGEvaW5zdGFsbC5qcycpO1xuICAgICAgY29uc3QgcHJlYnVpbHRQYXRoID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uL2xhbWJkYS9vdXQnKTtcbiAgICAgIGNoaWxkX3Byb2Nlc3MuZXhlY1N5bmMoYCR7cHJvY2Vzcy5hcmd2MH0gJHtpbnN0YWxsU2NyaXB0fSAke3ByZWJ1aWx0UGF0aH1gKTtcblxuICAgICAgcmV0dXJuIGxhbWJkYS5Db2RlLmZyb21Bc3NldChwcmVidWlsdFBhdGgpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgY29uc29sZS53YXJuKGBDYW4gbm90IGdldCBwcmVidWlsdCBsYW1iZGE6ICR7ZXJyfWApO1xuICAgIH1cbiAgfVxuXG4gIGNvbnNvbGUubG9nKCdCdWlsZCBsYW1iZGEgZnJvbSBzY3JhdGNoJyk7XG5cbiAgcmV0dXJuIGxhbWJkYS5Db2RlLmZyb21Eb2NrZXJCdWlsZChwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vbGFtYmRhJykpO1xufVxuXG5leHBvcnQgY2xhc3MgRG9ja2VySW1hZ2VOYW1lIGltcGxlbWVudHMgSUltYWdlTmFtZSB7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcml2YXRlIG5hbWU6IHN0cmluZywgcHVibGljIGNyZWRzPzogc3RyaW5nKSB7IH1cbiAgcHVibGljIGdldCB1cmkoKTogc3RyaW5nIHsgcmV0dXJuIGBkb2NrZXI6Ly8ke3RoaXMubmFtZX1gOyB9XG59XG5cbmV4cG9ydCBjbGFzcyBTM0FyY2hpdmVOYW1lIGltcGxlbWVudHMgSUltYWdlTmFtZSB7XG4gIHByaXZhdGUgbmFtZTogc3RyaW5nO1xuICBwdWJsaWMgY29uc3RydWN0b3IocDogc3RyaW5nLCByZWY/OiBzdHJpbmcsIHB1YmxpYyBjcmVkcz86IHN0cmluZykge1xuICAgIHRoaXMubmFtZSA9IHA7XG4gICAgaWYgKHJlZikge1xuICAgICAgdGhpcy5uYW1lICs9ICc6JyArIHJlZjtcbiAgICB9XG4gIH1cbiAgcHVibGljIGdldCB1cmkoKTogc3RyaW5nIHsgcmV0dXJuIGBzMzovLyR7dGhpcy5uYW1lfWA7IH1cbn1cblxuZXhwb3J0IGNsYXNzIEVDUkRlcGxveW1lbnQgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogRUNSRGVwbG95bWVudFByb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcbiAgICBjb25zdCBtZW1vcnlMaW1pdCA9IHByb3BzLm1lbW9yeUxpbWl0ID8/IDUxMjtcbiAgICBjb25zdCBoYW5kbGVyID0gbmV3IGxhbWJkYS5TaW5nbGV0b25GdW5jdGlvbih0aGlzLCAnQ3VzdG9tUmVzb3VyY2VIYW5kbGVyJywge1xuICAgICAgdXVpZDogdGhpcy5yZW5kZXJTaW5nbGV0b25VdWlkKG1lbW9yeUxpbWl0KSxcbiAgICAgIGNvZGU6IGdldENvZGUoKSxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLkdPXzFfWCxcbiAgICAgIGhhbmRsZXI6ICdtYWluJyxcbiAgICAgIGVudmlyb25tZW50OiBwcm9wcy5lbnZpcm9ubWVudCxcbiAgICAgIGxhbWJkYVB1cnBvc2U6ICdDdXN0b206OkNES0VDUkRlcGxveW1lbnQnLFxuICAgICAgdGltZW91dDogRHVyYXRpb24ubWludXRlcygxNSksXG4gICAgICByb2xlOiBwcm9wcy5yb2xlLFxuICAgICAgbWVtb3J5U2l6ZTogbWVtb3J5TGltaXQsXG4gICAgICB2cGM6IHByb3BzLnZwYyxcbiAgICAgIHZwY1N1Ym5ldHM6IHByb3BzLnZwY1N1Ym5ldHMsXG4gICAgfSk7XG5cbiAgICBjb25zdCBoYW5kbGVyUm9sZSA9IGhhbmRsZXIucm9sZTtcbiAgICBpZiAoIWhhbmRsZXJSb2xlKSB7IHRocm93IG5ldyBFcnJvcignbGFtYmRhLlNpbmdsZXRvbkZ1bmN0aW9uIHNob3VsZCBoYXZlIGNyZWF0ZWQgYSBSb2xlJyk7IH1cblxuICAgIGhhbmRsZXJSb2xlLmFkZFRvUHJpbmNpcGFsUG9saWN5KFxuICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAnZWNyOkdldEF1dGhvcml6YXRpb25Ub2tlbicsXG4gICAgICAgICAgJ2VjcjpCYXRjaENoZWNrTGF5ZXJBdmFpbGFiaWxpdHknLFxuICAgICAgICAgICdlY3I6R2V0RG93bmxvYWRVcmxGb3JMYXllcicsXG4gICAgICAgICAgJ2VjcjpHZXRSZXBvc2l0b3J5UG9saWN5JyxcbiAgICAgICAgICAnZWNyOkRlc2NyaWJlUmVwb3NpdG9yaWVzJyxcbiAgICAgICAgICAnZWNyOkxpc3RJbWFnZXMnLFxuICAgICAgICAgICdlY3I6RGVzY3JpYmVJbWFnZXMnLFxuICAgICAgICAgICdlY3I6QmF0Y2hHZXRJbWFnZScsXG4gICAgICAgICAgJ2VjcjpMaXN0VGFnc0ZvclJlc291cmNlJyxcbiAgICAgICAgICAnZWNyOkRlc2NyaWJlSW1hZ2VTY2FuRmluZGluZ3MnLFxuICAgICAgICAgICdlY3I6SW5pdGlhdGVMYXllclVwbG9hZCcsXG4gICAgICAgICAgJ2VjcjpVcGxvYWRMYXllclBhcnQnLFxuICAgICAgICAgICdlY3I6Q29tcGxldGVMYXllclVwbG9hZCcsXG4gICAgICAgICAgJ2VjcjpQdXRJbWFnZScsXG4gICAgICAgIF0sXG4gICAgICAgIHJlc291cmNlczogWycqJ10sXG4gICAgICB9KSk7XG4gICAgaGFuZGxlclJvbGUuYWRkVG9QcmluY2lwYWxQb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICAnczM6R2V0T2JqZWN0JyxcbiAgICAgIF0sXG4gICAgICByZXNvdXJjZXM6IFsnKiddLFxuICAgIH0pKTtcblxuICAgIG5ldyBDdXN0b21SZXNvdXJjZSh0aGlzLCAnQ3VzdG9tUmVzb3VyY2UnLCB7XG4gICAgICBzZXJ2aWNlVG9rZW46IGhhbmRsZXIuZnVuY3Rpb25Bcm4sXG4gICAgICByZXNvdXJjZVR5cGU6ICdDdXN0b206OkNES0J1Y2tldERlcGxveW1lbnQnLFxuICAgICAgcHJvcGVydGllczoge1xuICAgICAgICBTcmNJbWFnZTogcHJvcHMuc3JjLnVyaSxcbiAgICAgICAgU3JjQ3JlZHM6IHByb3BzLnNyYy5jcmVkcyxcbiAgICAgICAgRGVzdEltYWdlOiBwcm9wcy5kZXN0LnVyaSxcbiAgICAgICAgRGVzdENyZWRzOiBwcm9wcy5kZXN0LmNyZWRzLFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyU2luZ2xldG9uVXVpZChtZW1vcnlMaW1pdD86IG51bWJlcikge1xuICAgIGxldCB1dWlkID0gJ2JkMDdjOTMwLWVkYjktNDExMi1hMjBmLTAzZjA5NmY1MzY2Nic7XG5cbiAgICAvLyBpZiB1c2VyIHNwZWNpZnkgYSBjdXN0b20gbWVtb3J5IGxpbWl0LCBkZWZpbmUgYW5vdGhlciBzaW5nbGV0b24gaGFuZGxlclxuICAgIC8vIHdpdGggdGhpcyBjb25maWd1cmF0aW9uLiBvdGhlcndpc2UsIGl0IHdvbid0IGJlIHBvc3NpYmxlIHRvIHVzZSBtdWx0aXBsZVxuICAgIC8vIGNvbmZpZ3VyYXRpb25zIHNpbmNlIHdlIGhhdmUgYSBzaW5nbGV0b24uXG4gICAgaWYgKG1lbW9yeUxpbWl0KSB7XG4gICAgICBpZiAoVG9rZW4uaXNVbnJlc29sdmVkKG1lbW9yeUxpbWl0KSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NhblxcJ3QgdXNlIHRva2VucyB3aGVuIHNwZWNpZnlpbmcgXCJtZW1vcnlMaW1pdFwiIHNpbmNlIHdlIHVzZSBpdCB0byBpZGVudGlmeSB0aGUgc2luZ2xldG9uIGN1c3RvbSByZXNvdXJjZSBoYW5kbGVyJyk7XG4gICAgICB9XG5cbiAgICAgIHV1aWQgKz0gYC0ke21lbW9yeUxpbWl0LnRvU3RyaW5nKCl9TWlCYDtcbiAgICB9XG5cbiAgICByZXR1cm4gdXVpZDtcbiAgfVxufVxuIl19