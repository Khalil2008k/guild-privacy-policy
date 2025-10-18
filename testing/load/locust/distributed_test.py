
// Locust Master Configuration for Distributed Testing
import os
from locust.env import Environment
from locust.stats import print_stats, print_percentile_stats
from guild_load_test import GuildAPIUser

# Create environment
env = Environment(user_classes=[GuildAPIUser], host="https://api.guild.com")

# Start Locust in master mode
if __name__ == "__main__":
    # Parse command line arguments for distributed testing
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--master", action="store_true", help="Run as master")
    parser.add_argument("--worker", action="store_true", help="Run as worker")
    parser.add_argument("--master-host", default="127.0.0.1", help="Master host")
    parser.add_argument("--master-port", type=int, default=5557, help="Master port")

    args = parser.parse_args()

    if args.master:
        # Run as master
        print("Starting Locust master...")
        env.create_master_runner(
            master_host=args.master_host,
            master_port=args.master_port
        )
    elif args.worker:
        # Run as worker
        print("Starting Locust worker...")
        env.create_worker_runner(args.master_host, args.master_port)
    else:
        # Run standalone
        print("Starting Locust standalone...")
        env.create_local_runner()

    # Start the test
    env.runner.start(1, hatch_rate=10)  # 1 user, 10 users per second

    # Keep running
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Stopping test...")
        env.runner.quit()
        print_stats(env.runner.stats)
        print_percentile_stats(env.runner.stats)
