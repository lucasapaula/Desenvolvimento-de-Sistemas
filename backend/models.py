from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base


class Restaurante(Base):
    __tablename__ = "restaurantes"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)

    cardapio = relationship(
        "Comida",
        back_populates="restaurante",
        cascade="all, delete-orphan"
    )


class Comida(Base):
    __tablename__ = "comidas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    preco = Column(Float, nullable=False)
    restaurante_id = Column(Integer, ForeignKey("restaurantes.id"), nullable=False)

    restaurante = relationship("Restaurante", back_populates="cardapio")