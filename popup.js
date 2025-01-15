document.getElementById("highlightButton").addEventListener("click", () => {
  console.log("Highlight button clicked");
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0 || !tabs[0].id) {
      console.error("No active tab found or tab ID is undefined");
      return;
    }

    if (chrome.scripting) {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          func: () => {
            const classesToHighlight = [
              "c-product__mrp",
              "cart-box-legal-text",
              "oldProductPrice",
              "product__limited",
              "minimal-price",
              "lowestProductPrice30D",
              "ProductPrice- HighPrice",
              "product-cardz__price-lowest-price",
              "kaina",
              "old_price",
              "originalPriceLineThroughWrapper",
              "omnibus",
            ];
            const phrasesToCheck = ["mažiausia kaina", "žemiausia kaina", "geriausia kaina"];

            let foundElements = [];
            let highestPrice;
            let highestFontSize = 0;

            function getContrastColor(rgb) {
              const [r, g, b] = rgb.match(/\d+/g).map(Number);
              const brightness = (r * 299 + g * 587 + b * 114) / 1000;
              return brightness > 128 ? "black" : "white";
            }

            function highlightElements() {
              classesToHighlight.forEach((className) => {
                document
                  .querySelectorAll(`.${className}`)
                  .forEach((element) => {
                    if (element.dataset.colorChanged) return; // Skip if color was already changed

                    const fontSize = window.getComputedStyle(element).fontSize;
                    const fontSizeValue = parseFloat(fontSize);

                    const backgroundColor =
                      window.getComputedStyle(element).backgroundColor;

                    if (fontSizeValue <= 8) {
                      element.style.fontSize = "12px";
                    }

                    if (
                      backgroundColor !== "rgba(0, 0, 0, 0)" &&
                      backgroundColor !== "transparent"
                    ) {
                      element.style.color = getContrastColor(backgroundColor);
                    } else {
                      element.style.color = "rgba(0, 0, 0, 1)";
                    }

                    element.dataset.colorChanged = true; // Mark as changed
                    foundElements.push(element);

                    if (
                      phrasesToCheck.some(phrase => element.textContent.toLowerCase().includes(phrase))
                    ) {
                      console.log("price");
                      // Extract price as the number followed by €
                      const priceMatch =
                        element.textContent.match(/(\d+[\.,]?\d*)\s*€/);
                      if (priceMatch) {
                        const price = parseFloat(priceMatch[1].replace(",", "."));
  
                        // Compare the font size to find the highest font size price
                        if (fontSizeValue > highestFontSize) {
                          console.log(`if,`, price);
  
                          highestFontSize = fontSizeValue;
                          highestPrice = price;
                        }
                      }
                    }

                  });
              });

              classesToHighlight.forEach((value) => {
                document.querySelectorAll("*").forEach((element) => {
                  // Skip if the color was already changed
                  if (element.dataset.colorChanged) return;

                  // Check if any attribute of the element matches the value
                  const hasMatchingValue = [...element.attributes].some(
                    (attr) => attr.value === value
                  );
                  if (!hasMatchingValue) return;

                  const fontSize = window.getComputedStyle(element).fontSize;
                  const fontSizeValue = parseFloat(fontSize);

                  const backgroundColor =
                    window.getComputedStyle(element).backgroundColor;
                  const textColor = window.getComputedStyle(element).color;

                  if (fontSizeValue <= 8) {
                    element.style.fontSize = "12px";
                  }

                  if (
                    backgroundColor !== "rgba(0, 0, 0, 0)" &&
                    backgroundColor !== "transparent"
                  ) {
                    element.style.color = getContrastColor(backgroundColor);
                  } else {
                    element.style.color = "rgba(0, 0, 0, 1)";
                  }

                  if (
                    phrasesToCheck.some(phrase => element.textContent.toLowerCase().includes(phrase))
                  ) {
                    console.log("price");
                    // Extract price as the number followed by €
                    const priceMatch =
                      element.textContent.match(/(\d+[\.,]?\d*)\s*€/);
                    if (priceMatch) {
                      const price = parseFloat(priceMatch[1].replace(",", "."));

                      // Compare the font size to find the highest font size price
                      if (fontSizeValue > highestFontSize) {
                        console.log(`if,`, price);

                        highestFontSize = fontSizeValue;
                        highestPrice = price;
                      }
                    }
                  }

                  foundElements.push(element);
                });
              });


              if (!highestPrice) {
                document.querySelectorAll("*").forEach((element) => {
                  if (element.children.length === 0) {
                    const fontSize = window.getComputedStyle(element).fontSize;
                    const fontSizeValue = parseFloat(fontSize);

                    if (
                      phrasesToCheck.some((phrase) =>
                        element.textContent.toLowerCase().includes(phrase)
                      )
                    ) {
                      const priceMatch = element.textContent.match(/(\d+[\.,]?\d*)\s*€/);
                      if (priceMatch) {
                        const price = parseFloat(priceMatch[1].replace(",", "."));
                        if (fontSizeValue > highestFontSize) {
                          highestFontSize = fontSizeValue;
                          highestPrice = price;
                        }
                      }
                    }
                  }
                });
              }

              console.log(
                `Highest font size price: ${highestPrice} €, Font size: ${highestFontSize}px`
              );
              console.log(
                "Highlighted elements (with font size <= 8px):",
                foundElements
              );
            }

            highlightElements();

            return { highestPrice, highestFontSize };
          },
        },
        (results) => {
          if (chrome.runtime.lastError) {
            console.error(
              "Error executing script in popup.js:",
              chrome.runtime.lastError.message
            );
          } else {
            const [result] = results;
            const { highestPrice, highestFontSize } = result.result || {};
            const popupPricesDiv = document.getElementById("popupPrices");

            if (highestPrice !== null && highestPrice != undefined) {
              popupPricesDiv.innerHTML = `
                <p>Mažiausia 30d. kaina: <strong>${highestPrice} €</strong></p>
              `;
            } else {
              popupPricesDiv.innerHTML = `
                <p>Mažiausios 30d. kainos nėra</p>
              `;
            }
          }
        }
      );
    } else {
      console.error("Chrome scripting API is not available in popup.js");
    }
  });
});
