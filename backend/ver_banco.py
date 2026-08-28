from sqlalchemy import create_engine, text

engine = create_engine("sqlite:///./cartoon-themed.db")

with engine.connect() as conn:
    print("=== Restaurantes ===")
    for row in conn.execute(text("SELECT * FROM restaurantes")):
        print(row)

    print("\n=== Comidas ===")
    for row in conn.execute(text("SELECT * FROM comidas")):
        print(row)