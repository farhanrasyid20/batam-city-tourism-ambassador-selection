from locust import HttpUser, task, between


class WebsiteUser(HttpUser):
    wait_time = between(1, 3)

    @task(4)
    def landing_page(self):
        self.client.get("/api/public/landing-page", name="Landing Page")

    @task(3)
    def news(self):
        self.client.get("/api/public/news", name="News")

    @task(2)
    def faq(self):
        self.client.get("/api/public/faqs", name="FAQ")

    @task(2)
    def finalists(self):
        self.client.get("/api/public/finalists", name="Finalists")

    @task(1)
    def branding(self):
        self.client.get(
            "/api/public/site-settings/branding",
            name="Branding Settings",
        )
