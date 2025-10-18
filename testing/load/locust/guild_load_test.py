
// Locust Distributed Load Testing Configuration
import time
import random
import json
from locust import HttpUser, task, between, events
from locust.runners import MasterRunner, WorkerRunner

class GuildAPIUser(HttpUser):
    """Simulates users interacting with Guild API"""

    wait_time = between(1, 5)  # Wait 1-5 seconds between tasks
    host = "https://api.guild.com"

    def on_start(self):
        """Called when a user starts"""
        self.user_id = f"user_{random.randint(1, 1000000)}"
        self.headers = {
            "Content-Type": "application/json",
            "User-Agent": "Locust Load Test"
        }

    @task(3)  # Higher weight for job browsing
    def browse_jobs(self):
        """Browse available jobs"""
        with self.client.get("/api/v1/jobs", headers=self.headers) as response:
            if response.status_code == 200:
                jobs = response.json()
                if jobs.get('jobs') and len(jobs['jobs']) > 0:
                    # View a random job
                    job_id = random.choice(jobs['jobs'])['id']
                    self.client.get(f"/api/v1/jobs/{job_id}", headers=self.headers)

    @task(2)
    def search_jobs(self):
        """Search for jobs"""
        skills = ["JavaScript", "Python", "React", "Node.js", "Angular", "Vue.js"]
        skill = random.choice(skills)

        with self.client.get(
            f"/api/v1/jobs?skills={skill}&limit=20",
            headers=self.headers
        ) as response:
            if response.status_code == 200:
                pass  # Search completed successfully

    @task(1)
    def create_job(self):
        """Create a new job posting"""
        job_data = {
            "title": f"Test Job {random.randint(1, 1000)}",
            "description": "This is a test job created by Locust load testing.",
            "budget": random.randint(100, 10000),
            "skills": ["JavaScript", "React"],
            "duration": random.randint(1, 30)
        }

        with self.client.post(
            "/api/v1/jobs",
            json=job_data,
            headers=self.headers
        ) as response:
            if response.status_code in [200, 201]:
                # Job created successfully
                job_id = response.json().get('id')
                if job_id:
                    self.client.get(f"/api/v1/jobs/{job_id}", headers=self.headers)

    @task(1)
    def user_registration(self):
        """Register new users"""
        user_data = {
            "email": f"testuser{random.randint(1, 1000000)}@example.com",
            "password": "SecurePassword123!",
            "name": f"Test User {random.randint(1, 1000)}",
            "skills": ["JavaScript", "React"]
        }

        with self.client.post(
            "/api/v1/auth/register",
            json=user_data,
            headers=self.headers
        ) as response:
            if response.status_code == 201:
                # Registration successful
                pass

    @task(1)
    def authentication(self):
        """Test authentication endpoints"""
        # Login
        login_data = {
            "email": "test@example.com",
            "password": "password123"
        }

        with self.client.post(
            "/api/v1/auth/login",
            json=login_data,
            headers=self.headers
        ) as response:
            if response.status_code == 200:
                # Login successful, get token
                token = response.json().get('token')
                if token:
                    self.headers["Authorization"] = f"Bearer {token}"

                    # Test authenticated endpoint
                    self.client.get("/api/v1/user/profile", headers=self.headers)

    @task
    def health_check(self):
        """Check API health"""
        self.client.get("/health", headers=self.headers)

# Event handlers for monitoring
@events.request.add_listener
def on_request(request_type, name, response_time, response_length, exception, **kwargs):
    """Called on every request"""
    if exception:
        events.request_failure.fire(
            request_type=request_type,
            name=name,
            response_time=response_time,
            exception=exception,
            **kwargs
        )
    else:
        events.request_success.fire(
            request_type=request_type,
            name=name,
            response_time=response_time,
            response_length=response_length,
            **kwargs
        )

@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """Called when test starts"""
    print(f"Starting load test with {environment.runner.user_count} users")

@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Called when test stops"""
    print("Load test completed")

# Distributed testing configuration
if __name__ == "__main__":
    import os

    # Check if running as master or worker
    if os.getenv("LOCUST_MODE") == "worker":
        # Worker configuration
        from locust.stats import print_stats

        @events.test_stop.add_listener
        def on_worker_test_stop(environment, **kwargs):
            print("Worker test completed")

    else:
        # Master configuration
        @events.test_stop.add_listener
        def on_master_test_stop(environment, **kwargs):
            print("Master test completed")
            print_stats(environment.runner.stats)
