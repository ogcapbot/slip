// generatePatreonImage.js
import { loadHtml2Canvas } from './utils.js'; 
// utils.js just has the html2canvas loader, or you can inline it here if you want

export async function generatePatreonImage(pickData) {
  return new Promise((resolve, reject) => {
    loadHtml2Canvas(async () => {
      try {
        const finalWidth = 384;

        // Create offscreen container
        const offscreen = document.createElement('div');
        offscreen.style.width = `${finalWidth}px`;
        offscreen.style.backgroundColor = '#fff';
        offscreen.style.fontFamily = 'Arial, sans-serif';
        offscreen.style.fontSize = '14px';
        offscreen.style.padding = '0 10px 10px';
        offscreen.style.position = 'relative';
        offscreen.style.boxSizing = 'border-box';

        // === HEADER ===
        const headerImg = document.createElement('img');
        headerImg.src = 'https://capper.ogcapperbets.com/admin/images/imageHeader.png';
        headerImg.style.display = 'block';
        headerImg.style.margin = '0 auto 8px';
        headerImg.style.maxWidth = '100%';
        headerImg.style.height = 'auto';
        offscreen.appendChild(headerImg);

        // === CONFIDENTIALITY NOTICE ===
        const confNotice = document.createElement('div');
        confNotice.textContent = '⚠️ CONFIDENTIALITY NOTICE ⚠️ All OG Capper Bets Content is PRIVATE. Leaking, Stealing or Sharing ANY content is STRICTLY PROHIBITED. Violation = Termination. No Refund. No Appeal. Lifetime Ban.';
        confNotice.style.fontSize = '9px';
        confNotice.style.fontWeight = '700';
        confNotice.style.color = 'red';
        confNotice.style.textAlign = 'center';
        confNotice.style.marginBottom = '10px';
        offscreen.appendChild(confNotice);

        // === MAIN CONTENT CONTAINER ===
        const mainContent = document.createElement('div');
        mainContent.style.border = '2px solid black';
        mainContent.style.padding = '10px';
        mainContent.style.borderRadius = '8px';
        mainContent.style.backgroundColor = '#fafafa';
        mainContent.style.color = '#000';

        // Title block
        const titleBlock = document.createElement('div');
        titleBlock.style.textAlign = 'center';
        titleBlock.style.fontWeight = '900';
        titleBlock.style.fontSize = '18px';
        titleBlock.style.backgroundColor = 'black';
        titleBlock.style.color = 'white';
        titleBlock.style.padding = '6px 0';
        titleBlock.style.marginBottom = '8px';
        titleBlock.textContent = 'OFFICIAL PICK';
        mainContent.appendChild(titleBlock);

        // Sections helper function
        function createSection(title) {
          const section = document.createElement('div');
          section.style.marginBottom = '10px';

          const h2 = document.createElement('h2');
          h2.textContent = title.toUpperCase();
          h2.style.backgroundColor = 'black';
          h2.style.color = 'white';
          h2.style.padding = '4px 8px';
          h2.style.fontWeight = '900';
          h2.style.fontSize = '14px';
          h2.style.margin = '0 0 6px 0';
          section.appendChild(h2);

          return section;
        }

        // Utility to create a row with label and value
        function createRow(label, value, italic = false) {
          const row = document.createElement('div');
          row.style.display = 'flex';
          row.style.justifyContent = 'space-between';
          row.style.marginBottom = '3px';
          row.style.fontSize = '13px';
          row.style.fontWeight = '700';

          const labelDiv = document.createElement('div');
          labelDiv.textContent = label + ':';
          labelDiv.style.flex = '0 0 130px';

          const valueDiv = document.createElement('div');
          valueDiv.textContent = value || 'N/A';
          valueDiv.style.flex = '1';
          valueDiv.style.fontWeight = italic ? '400' : '700';
          if (italic) valueDiv.style.fontStyle = 'italic';

          row.appendChild(labelDiv);
          row.appendChild(valueDiv);
          return row;
        }

        // --- Straight Wager Section ---
        const straightSection = createSection('Straight Wager');
        straightSection.appendChild(createRow('Official Pick', pickData.FULL_TEAM_ENTERED));
        straightSection.appendChild(createRow('Official Type', pickData.FULL_BET_TYPE));
        straightSection.appendChild(createRow('Official Wager', pickData.FULL_WAGER_OUTPUT));
        straightSection.appendChild(createRow('Pick Desc', pickData.PICK_DESC));
        straightSection.appendChild(createRow('Notes', pickData.NOTES, true));
        mainContent.appendChild(straightSection);

        // --- Game Details Section ---
        const gameDetails = createSection('Game Details');
        gameDetails.appendChild(createRow('Sport', pickData.FULL_SPORT_NAME));
        gameDetails.appendChild(createRow('League', pickData.FULL_LEAGUE_NAME));
        gameDetails.appendChild(createRow('Home Team', pickData.HOME_TEAM_FULL_NAME));
        gameDetails.appendChild(createRow('Away Team', pickData.AWAY_TEAM_FULL_NAME));
        gameDetails.appendChild(createRow('Game Time', pickData.DATE_AND_TIME_GAME_START));
        mainContent.appendChild(gameDetails);

        // --- Pick Details Section ---
        const pickDetails = createSection('Pick Details');
        pickDetails.appendChild(createRow('Title', pickData.TITLE));
        pickDetails.appendChild(createRow('Pick ID', pickData.PICKID));
        pickDetails.appendChild(createRow('Pick by', pickData.CAPPERS_NAME));
        pickDetails.appendChild(createRow('Input Value', pickData.USER_INPUT_VALUE));
        pickDetails.appendChild(createRow('Created', pickData.LONG_DATE_SECONDS));
        mainContent.appendChild(pickDetails);

        offscreen.appendChild(mainContent);

        // === FOOTER ===
        const footerImg = document.createElement('img');
        footerImg.src = 'https://capper.ogcapperbets.com/admin/images/imageFooter.png';
        footerImg.style.display = 'block';
        footerImg.style.marginTop = '10px';
        footerImg.style.maxWidth = '100%';
        footerImg.style.height = 'auto';
        offscreen.appendChild(footerImg);

        // === WATERMARKS ===
        const watermarkCount = 5;
        const watermarkStartTop = headerImg.offsetHeight + confNotice.offsetHeight + 20;
        const watermarkSpacing = 200;

        for (let i = 0; i < watermarkCount; i++) {
          const watermark = document.createElement('div');
          watermark.textContent = '© ogcapperbets.com ©';
          watermark.style.position = 'absolute';
          watermark.style.color = '#000';
          watermark.style.opacity = '0.15';
          watermark.style.fontSize = '20px';
          watermark.style.fontWeight = '700';
          watermark.style.userSelect = 'none';
          watermark.style.pointerEvents = 'none';
          watermark.style.whiteSpace = 'nowrap';
          watermark.style.transform = 'rotate(315deg)';
          watermark.style.zIndex = '0';

          watermark.style.left = '75px';
          watermark.style.top = `${watermarkStartTop + i * watermarkSpacing}px`;

          offscreen.appendChild(watermark);
        }

        offscreen.style.position = 'fixed';
        offscreen.style.left = '-9999px';
        offscreen.style.top = '-9999px';
        document.body.appendChild(offscreen);

        // Generate canvas image
        const canvas = await html2canvas(offscreen, {
          scale: 2,
          useCORS: true,
          backgroundColor: null,
          width: finalWidth,
          windowWidth: finalWidth
        });

        document.body.removeChild(offscreen);

        // Return image as Data URL
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        reject(err);
      }
    });
  });
}
