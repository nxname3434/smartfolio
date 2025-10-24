from __future__ import annotations

import os
from flask import (
    Flask,
    jsonify,
    redirect,
    render_template,
    request,
    session,
    url_for,
)


def create_app() -> Flask:
    """Create the minimal Flask application used for the public static site."""
    app = Flask(
        __name__,
        static_folder="static",
        static_url_path="/static",
        template_folder="templates",
    )

    # Built-in Flask session support only requires a secret key.
    app.secret_key = os.environ.get("STATIC_WEBSITE_SECRET", "change-me")

    demo_password = os.environ.get("STATIC_WEBSITE_PASSWORD", "demo")

    def _company_name() -> str:
        """Return the company name stored in the session or a default value."""
        return session.get("company", "Samena")

    @app.route("/")
    def login() -> str:
        """Landing page that shows the login form."""
        if session.get("logged_in"):
            return redirect(url_for("dashboard"))
        return render_template("login.html")

    @app.route("/login")
    def login_redirect() -> str:
        """Keep /login compatible with existing links."""
        return redirect(url_for("login"))

    @app.route("/app")
    def dashboard() -> str:
        """Main application placeholder page."""
        return render_template("index.html", company_name=_company_name())

    @app.route("/compta")
    def compta() -> str:
        """Render the accounting assistant placeholder page."""
        return render_template("compta.html")

    @app.route("/explain")
    def explain() -> str:
        """Render the document explanation placeholder page."""
        return render_template("explain.html")

    @app.route("/prospec")
    def prospec() -> str:
        """Render the prospecting assistant placeholder page."""
        return render_template("prospec.html")

    @app.route("/logout")
    def logout() -> str:
        """Clear the session and return to the login page."""
        session.clear()
        return redirect(url_for("login"))

    @app.route("/api/login", methods=["POST"])
    def api_login():
        """Minimal login endpoint used by the front-end."""
        payload = request.get_json(silent=True) or {}
        company = (payload.get("company") or "").strip()
        password = payload.get("password")

        if not company or not password:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Entreprise et mot de passe sont requis.",
                    }
                ),
                400,
            )

        if password != demo_password:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Mot de passe incorrect pour la version demo.",
                    }
                ),
                401,
            )

        session["logged_in"] = True
        session["company"] = company
        session.permanent = True

        return jsonify({"success": True, "redirect_url": url_for("dashboard")})

    @app.route("/api/compta", methods=["POST"])
    def api_compta():
        """Return a placeholder response for the accounting assistant."""
        return jsonify(
            {
                "message": "Cette fonctionnalite IA est desactivee dans la version open-source.",
                "csv_data": None,
                "is_html": False,
                "html_content": None,
            }
        )

    @app.route("/api/explain", methods=["POST"])
    def api_explain():
        """Return a placeholder response for the explain assistant."""
        return jsonify(
            {
                "message": "Cette fonctionnalite IA est desactivee dans la version open-source.",
                "explanation": "La generation automatique n'est pas disponible dans cette version de demonstration.",
            }
        )

    @app.route("/api/prospect", methods=["POST"])
    def api_prospect():
        """Return sample prospecting questions so the UI keeps working."""
        sample_questions = [
            "Quelle est votre proposition de valeur principale ?",
            "Quel segment de clients ciblez-vous en priorite ?",
            "Quel budget marketing souhaitez-vous consacrer ce trimestre ?",
        ]
        return jsonify(
            {
                "message": "Exemple de questions fourni pour la version open-source.",
                "questions": sample_questions,
            }
        )

    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=int(os.environ.get("PORT", "5000")))
