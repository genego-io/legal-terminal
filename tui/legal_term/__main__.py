"""Entry point for `python -m legal_term` and the `legal-term` console script."""
from .app import LegalTermApp


def main() -> None:
    app = LegalTermApp()
    app.run()


if __name__ == "__main__":
    main()
