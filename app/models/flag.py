from sqlalchemy import String, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Flag(Base):
    __tablename__ = "flags"

    id: Mapped[int] = mapped_column(primary_key=True)

    environment_id: Mapped[int] = mapped_column(
        ForeignKey("environments.id"),
        nullable=False,
        index=True
    )

    key: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True
    )

    type: Mapped[str] = mapped_column(String(20), nullable=False)

    default_value: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    enabled: Mapped[bool] = mapped_column(
        nullable=False,
        default=False
    )

    rollout_percentage: Mapped[int] = mapped_column(
        nullable=False,
        default=100
    )

    description: Mapped[str | None] = mapped_column(String(255))

    owner_team: Mapped[str | None] = mapped_column(String(100))

    environment = relationship(
        "Environment",
        back_populates="flags"
    )

    versions = relationship(
        "FlagVersion",
        back_populates="flag",
        cascade="all, delete-orphan"
    )

    targeting_rules = relationship(
        "TargetingRule",
        back_populates="flag",
        cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index(
            "ix_flags_environment_key",
            "environment_id",
            "key",
            unique=True
        ),
    )
