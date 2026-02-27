pipeline {
    agent { label 'agent-vinod' }

    environment {
        DOCKER_USERNAME = 'himaneeshj'
        DOCKERHUB_CREDENTIALS = credentials('docker-hub_creds')
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Backend Dependencies') {
            steps {
                dir('backend') {
                    sh 'npm install'
                }
            }
        }

      stage('Run Backend Tests') {
    steps {
        dir('backend') {
            withEnv([
                "PORT=5000",
                "MONGO_URI=dummy",
                "JWT_SECRET=dummy",
                "GOOGLE_CLIENT_ID=dummy_client_id",
                "GOOGLE_CLIENT_SECRET=dummy_client_secret",
                "GITHUB_CLIENT_ID=dummy",
                "GITHUB_CLIENT_SECRET=dummy",
                "FRONTEND_URL=http://localhost",
                "EMAIL_USER=dummy",
                "EMAIL_PASS=dummy"
            ]) {
                sh 'npm test'
            }
        }
    }
}

        stage('Lint & Audit Backend') {
            steps {
                dir('backend') {
                    sh 'npm audit || true'
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                sh 'docker build -t $DOCKER_USERNAME/shadowcanvas-backend ./backend'
                sh 'docker build -t $DOCKER_USERNAME/shadowcanvas-frontend ./frontend'
            }
        }

        stage('Security Scan (Trivy)') {
            steps {
                sh 'trivy image $DOCKER_USERNAME/shadowcanvas-backend || true'
                sh 'trivy image $DOCKER_USERNAME/shadowcanvas-frontend || true'
            }
        }

        stage('Push Images') {
            steps {
                sh '''
                echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKER_USERNAME --password-stdin
                docker push $DOCKER_USERNAME/shadowcanvas-backend
                docker push $DOCKER_USERNAME/shadowcanvas-frontend
                '''
            }
        }

        stage('Deploy with Docker Compose') {
            steps {
                sh '''
                docker compose pull
                docker compose up -d
                '''
            }
        }

        stage('Cleanup') {
            steps {
                sh 'docker system prune -f'
            }
        }
    }

    post {
        success {
            echo "✅ Sprint 2 Pipeline Completed Successfully"
        }
        failure {
            echo "❌ Pipeline Failed"
        }
    }
}
