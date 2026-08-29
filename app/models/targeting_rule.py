from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class TargetingRule(Base):
    __tablename__ = "targeting_rules"

    id: Mapped[int] = mapped_column(primary_key=True)
    flag_id: Mapped[int] = mapped_column(
        ForeignKey("flags.id"),
        nullable=False,
        index=True
    )
    attribute: Mapped[str] = mapped_column(String(100), nullable=False)
    operator: Mapped[str] = mapped_column(String(50), nullable=False)
    value: Mapped[str] = mapped_column(String(255), nullable=False)
    priority: Mapped[int] = mapped_column(nullable=False, default=0)

    flag = relationship("Flag", back_populates="targeting_rules")
