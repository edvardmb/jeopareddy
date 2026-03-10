import { Category } from "../api";
import { useTranslation } from "react-i18next";
import { Box, Button, Heading, Text } from "@chakra-ui/react";

type BoardCardProps = {
  categories: Category[];
  isDraft: boolean;
  isBusy: boolean;
  onEditCategory: (
    categoryId: string,
    payload: { name: string; displayOrder: number },
  ) => void;
  onDeleteCategory: (categoryId: string) => void;
  onStartEditClue: (payload: {
    categoryId: string;
    categoryName: string;
    categoryOrder: number;
    clueId: string;
    prompt: string;
    answer: string;
    pointValue: number;
    imageMimeType: string | null;
    imageBase64: string | null;
  }) => void;
  onDeleteClue: (clueId: string) => void;
  onToggleReveal: (clueId: string, currentValue: boolean) => void;
  onToggleAnswered: (clueId: string, currentValue: boolean) => void;
};

export default function BoardCard(props: BoardCardProps) {
  const { t } = useTranslation();
  const {
    categories,
    isDraft,
    isBusy,
    onEditCategory,
    onDeleteCategory,
    onStartEditClue,
    onDeleteClue,
    onToggleReveal,
    onToggleAnswered,
  } = props;

  return (
    <Box as="section" className="card card-board">
      <Heading as="h2" size="md">
        {t("components.boardCard.title")}
      </Heading>
      <Text className="muted">{t("components.boardCard.subtitle")}</Text>
      {!isDraft && (
        <Text className="tiny section-lock-note">
          {t("components.boardCard.draftOnlyNote")}
        </Text>
      )}
      {categories.length === 0 ? (
        <Text className="muted">{t("components.boardCard.noCategories")}</Text>
      ) : (
        categories.map((category) => (
          <Box as="details" key={category.id} className="category accordion-category">
            <Box as="summary" className="category-summary">
              <Text as="span" className="category-summary-title">
                {category.displayOrder}. {category.name}
              </Text>
              <Text as="span" className="tiny muted">
                {t("components.boardCard.questionsCount", {
                  count: category.clues.length,
                })}
              </Text>
            </Box>
            {isDraft && (
              <Box className="row" style={{ marginTop: "0.6rem" }}>
                <Button
                  className="btn-secondary"
                  disabled={isBusy}
                  type="button"
                  onClick={() => {
                    const nextName = window.prompt(
                      t("components.boardCard.promptCategoryName"),
                      category.name,
                    );
                    if (nextName === null) {
                      return;
                    }

                    const nextOrderRaw = window.prompt(
                      t("components.boardCard.promptCategoryOrder"),
                      String(category.displayOrder),
                    );
                    if (nextOrderRaw === null) {
                      return;
                    }

                    const nextOrder = Number(nextOrderRaw);
                    if (!Number.isInteger(nextOrder) || nextOrder <= 0) {
                      window.alert(
                        t("components.boardCard.invalidCategoryOrder"),
                      );
                      return;
                    }

                    onEditCategory(category.id, {
                      name: nextName,
                      displayOrder: nextOrder,
                    });
                  }}
                >
                  {t("components.boardCard.editCategory")}
                </Button>
                <Button
                  className="btn-danger"
                  disabled={isBusy}
                  type="button"
                  onClick={() => {
                    const confirmed = window.confirm(
                      t("components.boardCard.confirmDeleteCategory", {
                        name: category.name,
                      }),
                    );
                    if (!confirmed) {
                      return;
                    }

                    onDeleteCategory(category.id);
                  }}
                >
                  {t("components.boardCard.removeCategory")}
                </Button>
              </Box>
            )}
            <Box as="ul" className="list">
              {category.clues.map((clue) => (
                <Box as="li" key={clue.id} className="clue-admin-item">
                  <Text className="clue-admin-text">
                    <Box as="strong">{clue.pointValue}</Box> - {clue.prompt}
                    {clue.imageBase64
                      ? ` ${t("components.boardCard.imageTag")}`
                      : ""}
                  </Text>
                  <Box className="row clue-admin-controls">
                    <Box as="span" className="clue-admin-status">
                      <Text
                        as="span"
                        className={`state-pill ${clue.isRevealed ? "is-on" : ""}`}
                      >
                        {t("components.boardCard.revealedLabel")}:{" "}
                        {clue.isRevealed ? t("common.yes") : t("common.no")}
                      </Text>
                      <Text
                        as="span"
                        className={`state-pill ${clue.isAnswered ? "is-on" : ""}`}
                      >
                        {t("components.boardCard.answeredLabel")}:{" "}
                        {clue.isAnswered ? t("common.yes") : t("common.no")}
                      </Text>
                    </Box>
                    {isDraft && (
                      <>
                        <Button
                          className="btn-secondary"
                          disabled={isBusy}
                          type="button"
                          onClick={() => {
                            onStartEditClue({
                              categoryId: category.id,
                              categoryName: category.name,
                              categoryOrder: category.displayOrder,
                              clueId: clue.id,
                              prompt: clue.prompt,
                              answer: clue.answer,
                              pointValue: clue.pointValue,
                              imageMimeType: clue.imageMimeType,
                              imageBase64: clue.imageBase64,
                            });
                          }}
                        >
                          {t("components.boardCard.editQuestion")}
                        </Button>
                        <Button
                          className="btn-danger"
                          disabled={isBusy}
                          type="button"
                          onClick={() => {
                            const confirmed = window.confirm(
                              t("components.boardCard.confirmDeleteQuestion", {
                                prompt: clue.prompt,
                              }),
                            );
                            if (!confirmed) {
                              return;
                            }

                            onDeleteClue(clue.id);
                          }}
                        >
                          {t("components.boardCard.removeQuestion")}
                        </Button>
                      </>
                    )}
                    <Button
                      className="btn-secondary"
                      disabled={isBusy}
                      onClick={() => onToggleReveal(clue.id, clue.isRevealed)}
                    >
                      {t("components.boardCard.revealHide")}
                    </Button>
                    <Button
                      className="btn-secondary"
                      disabled={isBusy}
                      onClick={() => onToggleAnswered(clue.id, clue.isAnswered)}
                    >
                      {t("components.boardCard.markAnswered")}
                    </Button>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        ))
      )}
    </Box>
  );
}
