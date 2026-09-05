from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.database import Base


class Restaurante(Base):
    __tablename__ = "restaurantes"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    categoria = Column(String, nullable=True)
    descricao = Column(Text, nullable=True)
    endereco = Column(String, nullable=True)
    telefone = Column(String, nullable=True)

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