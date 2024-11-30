// import React from 'react';
// import { useLocation } from 'react-router-dom';


// import './summarypage.css';

// const SummaryPage = () => {
//   const location = useLocation();
//   const { groupedQuestions, categories } = location.state;

//   return (
//     <div className="summary-page">
//       <h2>All Survey Responses Grouped by Category</h2>
//       <table className="summary-table">
//         <thead>
//           <tr>
//             {categories.map((category, index) => (
//               <React.Fragment key={index}>
//                 <th>Q#</th>
//                 <th>{category}</th>
//               </React.Fragment>
//             ))}
//           </tr>
//         </thead>
//         <tbody>
//           {Object.values(groupedQuestions)[0]?.map((_, rowIndex) => (
//             <tr key={rowIndex}>
//               {categories.map((category, categoryIndex) => {
//                 const question = groupedQuestions[category][rowIndex];
//                 return (
//                   <React.Fragment key={categoryIndex}>
//                     <td>{question ? question.questionNumber : rowIndex + 1}</td>
//                     <td>{question ? question.score : ""}</td>
//                   </React.Fragment>
//                 );
//               })}
//             </tr>
//           ))}

//           <tr className="total-row">
//             {categories.map((category, index) => {
//               const totalScore = groupedQuestions[category].reduce(
//                 (sum, question) => sum + (question.score || 0),
//                 0
//               );
//               return (
//                 <React.Fragment key={index}>
//                   <td><strong>Total</strong></td>
//                   <td><strong>{totalScore}</strong></td>
//                 </React.Fragment>
//               );
//             })}
//           </tr>

//           <tr className="additional-marks-row">
//             {categories.map((category, index) => (
//               <React.Fragment key={index}>
//                 <td><strong>Additional Marks</strong></td>
//                 <td>
//                   {groupedQuestions[category].some((question) => question.additionalScore === 4)
//                     ? groupedQuestions[category].reduce(
//                         (sum, question) => sum + (question.additionalScore === 4 ? 4 : 0),
//                         0
//                       )
//                     : ''}
//                 </td>
//               </React.Fragment>
//             ))}
//           </tr>

//           <tr className="grand-total-row">
//             {categories.map((category, index) => {
//               const totalScore = groupedQuestions[category].reduce(
//                 (sum, question) => sum + (question.score || 0),
//                 0
//               );
//               const additionalScore = groupedQuestions[category].reduce(
//                 (sum, question) => sum + (question.additionalScore || 0),
//                 0
//               );
//               const categoryGrandTotal = totalScore + additionalScore;
//               return (
//                 <React.Fragment key={index}>
//                   <td><strong>Grand Total</strong></td>
//                   <td><strong>{categoryGrandTotal}</strong></td>
//                 </React.Fragment>
//               );
//             })}
//           </tr>
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default SummaryPage;






import React from 'react';
import { useLocation } from 'react-router-dom';

import './summarypage.css';

const SummaryPage = () => {
  const location = useLocation();
  const { groupedQuestions, categories } = location.state || {};

  // Debugging log
  console.log('Grouped Questions:', groupedQuestions);
  console.log('Categories:', categories);

  if (!groupedQuestions || !categories) {
    return <div>Error: Missing survey data.</div>;
  }

  return (
    <div className="summary-page">
      <h2>All Survey Responses Grouped by Category</h2>
      <table className="summary-table">
        <thead>
          <tr>
            {categories.map((category, index) => (
              <React.Fragment key={index}>
                <th>Q#</th>
                <th>{category}</th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {groupedQuestions[categories[0]].map((_, rowIndex) => (
            <tr key={rowIndex}>
              {categories.map((category, categoryIndex) => {
                const question = groupedQuestions[category][rowIndex];
                return (
                  <React.Fragment key={categoryIndex}>
                    <td>{question ? question.questionNumber : rowIndex + 1}</td>
                    <td>{question ? question.score : ""}</td>
                  </React.Fragment>
                );
              })}
            </tr>
          ))}

          <tr className="total-row">
            {categories.map((category, index) => {
              const totalScore = groupedQuestions[category].reduce(
                (sum, question) => sum + (question?.score || 0),
                0
              );
              return (
                <React.Fragment key={index}>
                  <td><strong>Total</strong></td>
                  <td><strong>{totalScore}</strong></td>
                </React.Fragment>
              );
            })}
          </tr>

          <tr className="additional-marks-row">
            {categories.map((category, index) => (
              <React.Fragment key={index}>
                <td><strong>Additional Marks</strong></td>
                <td>
                  {groupedQuestions[category].reduce(
                    (sum, question) => sum + (question?.additionalScore || 0),
                    0
                  )}
                </td>
              </React.Fragment>
            ))}
          </tr>

          <tr className="grand-total-row">
            {categories.map((category, index) => {
              const totalScore = groupedQuestions[category].reduce(
                (sum, question) => sum + (question?.score || 0),
                0
              );
              const additionalScore = groupedQuestions[category].reduce(
                (sum, question) => sum + (question?.additionalScore || 0),
                0
              );
              const categoryGrandTotal = totalScore + additionalScore;
              return (
                <React.Fragment key={index}>
                  <td><strong>Grand Total</strong></td>
                  <td><strong>{categoryGrandTotal}</strong></td>
                </React.Fragment>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default SummaryPage;
